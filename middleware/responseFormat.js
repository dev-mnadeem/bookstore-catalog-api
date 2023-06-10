'use strict';

const js2xmlparser = require('js2xmlparser');

const XML_TYPES = ['application/xml', 'text/xml'];
const JSON_TYPE = 'application/json';
const XML_ROOT = 'response';

/**
 * Decide the representation for a response.
 *
 * The assignment asks for "JSON or XML based on the Content-Type header", so
 * the request's own Content-Type is the primary signal. An explicit `Accept`
 * header still wins when the client sends one, because that is what every HTTP
 * client actually expects; JSON is the default when neither says anything.
 */
function resolveResponseType(req) {
  const accept = req.get('accept');
  if (accept && accept !== '*/*') {
    if (XML_TYPES.some((type) => accept.includes(type))) return 'xml';
    if (accept.includes(JSON_TYPE)) return 'json';
  }

  const contentType = req.get('content-type');
  if (contentType && XML_TYPES.some((type) => contentType.includes(type))) return 'xml';

  return 'json';
}

/**
 * XML element names cannot start with a digit, so a plain array of objects has
 * to be wrapped. Arrays are emitted as repeated <item> elements.
 */
function toXmlFriendly(payload) {
  if (Array.isArray(payload)) return { item: payload };
  return payload;
}

function responseFormat(req, res, next) {
  res.respond = function respond(status, payload) {
    if (payload === undefined || payload === null) return res.sendStatus(status);

    if (resolveResponseType(req) === 'xml') {
      const xml = js2xmlparser.parse(XML_ROOT, toXmlFriendly(payload), {
        declaration: { encoding: 'UTF-8' },
      });
      return res.status(status).type('application/xml').send(xml);
    }

    return res.status(status).type(JSON_TYPE).send(payload);
  };

  next();
}

module.exports = { responseFormat, resolveResponseType };
