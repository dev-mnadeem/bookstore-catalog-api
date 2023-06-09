'use strict';

const { resolveResponseType } = require('../../middleware/responseFormat');

const requestWith = (headers) => ({
  get: (name) => headers[name.toLowerCase()],
});

describe('resolveResponseType', () => {
  it('defaults to JSON', () => {
    expect(resolveResponseType(requestWith({}))).toBe('json');
  });

  it('honours an XML Content-Type', () => {
    expect(resolveResponseType(requestWith({ 'content-type': 'application/xml' }))).toBe('xml');
    expect(resolveResponseType(requestWith({ 'content-type': 'text/xml; charset=utf-8' }))).toBe(
      'xml'
    );
  });

  it('lets an explicit Accept header win over Content-Type', () => {
    const req = requestWith({ accept: 'application/json', 'content-type': 'application/xml' });
    expect(resolveResponseType(req)).toBe('json');
  });

  it('ignores a wildcard Accept and falls back to Content-Type', () => {
    const req = requestWith({ accept: '*/*', 'content-type': 'application/xml' });
    expect(resolveResponseType(req)).toBe('xml');
  });
});
