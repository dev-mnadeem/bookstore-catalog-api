'use strict';

const { resolveResponseType } = require('../../middleware/responseFormat');

const express = require('express');

const requestWith = (headers) => {
  const req = Object.create(express.request);
  req.headers = headers;
  return req;
};

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

  it('weighs q-values instead of matching substrings', () => {
    const req = requestWith({ accept: 'application/json, application/xml;q=0.5' });
    expect(resolveResponseType(req)).toBe('json');

    const xmlPreferred = requestWith({ accept: 'application/json;q=0.2, text/xml' });
    expect(resolveResponseType(xmlPreferred)).toBe('xml');
  });

  it('falls back to Content-Type when Accept names neither format', () => {
    const req = requestWith({ accept: 'text/html', 'content-type': 'application/xml' });
    expect(resolveResponseType(req)).toBe('xml');
  });

  it('ignores a wildcard Accept and falls back to Content-Type', () => {
    const req = requestWith({ accept: '*/*', 'content-type': 'application/xml' });
    expect(resolveResponseType(req)).toBe('xml');
  });
});
