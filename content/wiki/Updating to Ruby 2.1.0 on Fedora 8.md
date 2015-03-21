---
tags: ruby fedora
---

```shell
$ wget http://cache.ruby-lang.org/pub/ruby/2.1/ruby-2.1.0.tar.gz
$ openssl md5 ruby-2.1.0.tar.gz
$ tar xzf ruby-2.1.0.tar.gz
$ cd ruby-2.1.0
$ nice ./configure --prefix=/usr && nice make
$ sudo make install
```