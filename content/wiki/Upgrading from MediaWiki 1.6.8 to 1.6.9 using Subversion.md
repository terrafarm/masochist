---
tags: subversion mediawiki updates
cache_breaker: 1
---

The procedure for upgrading [MediaWiki](/wiki/MediaWiki) using [Subversion](/wiki/Subversion) is very similar to the one documented in "[Upgrading WordPress using Subversion](/wiki/Upgrading_WordPress_using_Subversion)".

# Backup

    OLD_VERSION="1.6.8"
    NEW_VERSION_TAG="REL1_6_9"
    INSTALL_PATH="path_where_software_is_installed"
    DATABASE_USER="database_user"
    DATABASE_NAME="database_name"
    APACHE_USER="user_that_apache_runs_as"

    # backup the database
    sudo -v
    sudo mysqldump --opt -u "${DATABASE_USER}" -p -h localhost \
        "${DATABASE_NAME}" | bzip2 -c > ~/mw-${OLD_VERSION}-db-backup.tar.bz2

    # backup the installed files
    cd "${INSTALL_PATH}"
    sudo tar -c -v . > ~/mw-${OLD_VERSION}-files-backup.tar
    gzip --verbose -9 ~/mw-${OLD_VERSION}-files-backup.tar

## Database backup notes

I actually have two different [MediaWiki](/wiki/MediaWiki) installs and my initial attempts to backup the databases produced different results. One wiki worked using the instructions exactly as provided above; in the second case [MySQL](/wiki/MySQL) reported insufficient privileges:

    mysqldump: Got error: 1044: Access denied for user 'xyz'@'localhost' to database 'abc' when using LOCK TABLES

As a temporary workaround I performed the backup as the [MySQL](/wiki/MySQL) root user, and then went back to inspect the privilege tables. It turns out that, in the database table, the users for both wikis had the same privileges ("Select", "Insert", "Update", "Delete"), but in the user table, one user had no special privileges and the other had "Create temp" and "Lock").

So I standardized things; each wiki needs two users:

1.  The user that accesses the wiki database when somebody explores the wiki using a web browser: this user has no special privileges in the user table, and only the defaults in the database table ("Select", "Insert", "Update", "Delete").
2.  A user with slightly higher privileges that is used for backups and for running maintenance scripts: this user will have the privileges, "Select", "Insert", "Update", "Delete", "Create", "Drop", "References", "Index", "Alter", "Create temp" and "Lock".

Note that as documented in "[UBB.threads 6.5.1.1 to 7.0 upgrade notes](/wiki/UBB.threads_6.5.1.1_to_7.0_upgrade_notes)" it is necessary to use the `OLD_PASSWORD` trick when creating new users, because the version of [PHP](/wiki/PHP) that is shipped with my version [Red Hat Enterprise Linux](/wiki/Red_Hat_Enterprise_Linux) is linked against an older version of [MySQL](/wiki/MySQL).

    mysql -u root -p

    USE mysql;
    SET PASSWORD FOR 'user_name'@'localhost' = OLD_PASSWORD('new_password');
    FLUSH PRIVILEGES;

# The [Subversion](/wiki/Subversion) update

When I first tried the upgrade [Subversion](/wiki/Subversion) warned me because I had deleted my `config` directory for security reasons:

    svn: Directory 'config' is missing

The solution was to revert the change:

    sudo -u "${APACHE_USER}" -H svn up config

Output:

    A    config
    A    config/index.php
    Updated to revision 19329.

Then the upgrade proceeded without errors:

    sudo -u "${APACHE_USER}" -H svn switch "http://svn.wikimedia.org/svnroot/mediawiki/tags/${NEW_VERSION_TAG}/phase3/"

Output:

    U    maintenance/update.php
    U    includes/AjaxDispatcher.php
    U    includes/DefaultSettings.php
    U    includes/normal/UtfNormal.php
    U    RELEASE-NOTES
    U    languages/LanguageNl.php
    U    languages/MessagesDe.php
    Updated to revision 19329.

Then, update any [Subversion externals](/wiki/Subversion_externals) which might be present (there are none, but it doesn't hurt to do an `svn up` anyway:

    sudo -u "${APACHE_USER}" -H svn up

Output:

    At revision 19329.

I then removed the `config` directory using [Subversion](/wiki/Subversion). I do not know if I'll have to restore it for the next upgrade as well:

    sudo -u "${APACHE_USER}" -H svn rm config

Output:

    D         config/index.php
    D         config

## [Subversion](/wiki/Subversion) update notes

Once again there were some minor differences between the two [MediaWiki](/wiki/MediaWiki) installs. The instructions as above worked for one of the wikis. That wiki has much more restrictive permissions (no file uploads etc) and runs in [PHP Safe Mode](/wiki/PHP_Safe_Mode). The other wiki has slightly relaxed permissions so as to allow file uploads but does not run under [PHP Safe Mode](/wiki/PHP_Safe_Mode). It runs in a root-owned directory whose group is the same as the [Apache](/wiki/Apache) webserver, but all other users are disallowed access; so the upgrade procedure is slightly different:

    sudo -s
    cd install_dir
    svn info
    svn switch "http://svn.wikimedia.org/svnroot/mediawiki/tags/${NEW_VERSION_TAG}/phase3/"

Output:

    U    maintenance/update.php
    U    includes/AjaxDispatcher.php
    U    includes/DefaultSettings.php
    U    includes/normal/UtfNormal.php
    U    RELEASE-NOTES
    U    languages/LanguageNl.php
    U    languages/MessagesDe.php
    Updated to revision 19331.

Then:

    svn up

Update permissions and ownership on modified files:

    chown root:apache_user includes/*.php includes/normal/*.php languages/*.php maintenance/*.php
    chmod 640 *.php includes/*.php includes/normal/*.php languages/*.php maintenance/*.php
    exit

# Running [MediaWiki](/wiki/MediaWiki)'s update script

[MediaWiki](/wiki/MediaWiki)'s [upgrade notes](http://svn.wikimedia.org/svnroot/mediawiki/tags/REL1_6_9/phase3/UPGRADE) state that you should run the `update.php` script when upgrading:

> From the command line, browse to the maintenance directory and run the update.php script to check and update the schema. This will insert missing tables, update existing tables, and move data around as needed. In most cases, this is successful and nothing further needs to be done.

The [MediaWiki](/wiki/MediaWiki) release notes tend to be pretty abysmal for incremental upgrades so it is never clear when you have to run the script. Although it is almost certainly not required for a minor update, I decided to run the script anyway.

Once again there were differences between the two wikis. For one of them I had not yet set-up the required `AdminSettings.php` file.

    sudo -u "${APACHE_USER}" cp AdminSettings.sample AdminSettings.php

Rather than store the admin username and password in the file I store it outside of the webroot:

    # database settings moved outside of webroot for security
    include("/full_path_to_config_folder/wiki_admin.php");
    #$wgDBadminuser      = 'wikiadmin';
    #$wgDBadminpassword  = 'adminpass';

The contents of the `wiki_admin.php` file:

    <?php
      # store the DB access stuff here just in case PHP ever flakes out and
      # the server starts serving up LocalSettings.php as plain text
      $wgDBadminuser      = 'wikiadmin';
      $wgDBadminpassword  = 'adminpass';
    ?>

It is then possible to run the update script:

    sudo -u "${APACHE_USER}" php ./update.php

Or in the case of the root-owned install:

    sudo php ./update.php

Output:

    MediaWiki 1.6.9 Updater

    Going to run database updates for xyz
    Depending on the size of your database this may take a while!
    Abort with control-c in the next five seconds...0
    ...hitcounter table already exists.
    ...querycache table already exists.
    ...objectcache table already exists.
    ...categorylinks table already exists.
    ...logging table already exists.
    ...validate table already exists.
    ...user_newtalk table already exists.
    ...transcache table already exists.
    ...trackbacks table already exists.
    ...externallinks table already exists.
    ...job table already exists.
    ...have ipb_id field in ipblocks table.
    ...have ipb_expiry field in ipblocks table.
    ...have rc_type field in recentchanges table.
    ...have rc_ip field in recentchanges table.
    ...have rc_id field in recentchanges table.
    ...have rc_patrolled field in recentchanges table.
    ...have user_real_name field in user table.
    ...have user_token field in user table.
    ...have user_email_token field in user table.
    ...have user_registration field in user table.
    ...have log_params field in logging table.
    ...have ar_rev_id field in archive table.
    ...have ar_text_id field in archive table.
    ...have page_len field in page table.
    ...have rev_deleted field in revision table.
    ...have img_width field in image table.
    ...have img_metadata field in image table.
    ...have img_media_type field in image table.
    ...have val_ip field in validate table.
    ...have ss_total_pages field in site_stats table.
    ...have iw_trans field in interwiki table.
    ...have ipb_range_start field in ipblocks table.
    ...have ss_images field in site_stats table.
    ...already have interwiki table
    ...indexes seem up to 20031107 standards
    Already have pagelinks; skipping old links table updates.
    ...image primary key already set.
    The watchlist table is already set up for email notification.
    ...watchlist talk page rows already present
    ...user table does not contain old email authentication field.
    Logging table has correct title encoding.
    ...page table already exists.
    revision timestamp indexes already up to 2005-03-13
    ...rev_text_id already in place.
    ...page_namespace is already a full int (int(11)).
    ...ar_namespace is already a full int (int(11)).
    ...rc_namespace is already a full int (int(11)).
    ...wl_namespace is already a full int (int(11)).
    ...qc_namespace is already a full int (int(11)).
    ...log_namespace is already a full int (int(11)).
    ...already have pagelinks table.
    ...templatelinks table already exists
    No img_type field in image table; Good.
    Already have unique user_name index.
    ...user_groups table already exists.
    ...user_groups is in current format.
    ...wl_notificationtimestamp is already nullable.
    ...timestamp key on logging already exists.
    Setting page_random to a random value on rows where it equals 0...changed 0 rows
    Initialising "MediaWiki" namespace...
    Clearing message cache...Done.
    Done.

# See also

-   1.6.9 release notes: <http://svn.wikimedia.org/svnroot/mediawiki/tags/REL1_6_9/phase3/RELEASE-NOTES>
-   Official [MediaWiki](/wiki/MediaWiki) notes on [Subversion](/wiki/Subversion)-based upgrades: <http://www.mediawiki.org/wiki/Download_from_SVN>
