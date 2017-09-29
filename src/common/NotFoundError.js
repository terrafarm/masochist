/**
 * @flow
 */

import createErrorClass from './createErrorClass';

export default createErrorClass('NotFoundError', function(message: string) {
  return {message};
});