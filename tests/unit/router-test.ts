import { test, module } from 'ember-qunit';
import { route, state, when, createMap } from 'ember-constraint-router/-dsl';

module('Unit - Router test', {
  beforeEach: function () {
  },
  afterEach: function () {
  },
});

test('.mount can mount to ember dsl', function (assert) {
  assert.expect(1);
  const map = createMap(() => [ route('foo'), route('bar', { path: 'other' }) ]);

  let routes: any[] = [];
  let emberRouterMap = {
    route(name, options) {
      routes.push({ name, options })
    }
  };

  map.mount(emberRouterMap);
  assert.deepEqual(routes, [
    { "name": "foo", "options": {} },
    { "name": "bar", "options": { "path": "other" } }
  ]);
});

test('it maintains a registry of child names', function (assert) {
  assert.expect(2);
  const map = createMap(() => [
    route('foo'),
    route('parent', () => [
      route('child'),
    ]),
  ]);

  let scope = map.getScope('parent')!.getScope('child')!;
  assert.equal(scope.name, 'child');

  let scope2 = map.getScope('child');
  assert.equal(scope2, scope);
});

test('allows state constraints', function (assert) {
  assert.expect(1);
  const map = createMap(() => [
    state('user-session', (us) => [
      when('absent', () => [
        route('get-user-session')
      ]),
      when('present', () => [
        route('logged-in')
      ]),
    ])
  ]);

  let dslCalls: any[] = [];

  let emberRouterMap = {
    route(name, options, desc) {
      dslCalls.push(['route', name, options]);
      desc && desc.call(emberRouterMap);
    }
  };

  map.mount(emberRouterMap);
  assert.deepEqual(dslCalls, [
    [ "route", "get-user-session", {} ],
    [ "route", "logged-in", {} ]
  ]);
});

test('route reduction', function (assert) {
  assert.expect(2);

  let map = createMap(() => [
    route('foo', { path: 'foo/:foo_id' }, () => [
      route('foochild', { path: 'foochild2' }),
      state('admin', (adminState) => [
        route('posts'),
        when({ foo: 123 }, () => [
          route('comments')
        ]),
        when({ other: 123 }, () => [
          route('comments')
        ]),
      ]),
      state('my-service')
    ]),
    route('bar'),
  ]);

  let routes: any[] = [];
  map._reduceToRouteTree(routes, map.root);

  assert.equal(routes[0].scope.name, 'foo');
  assert.deepEqual(routes[0].children.map(r => r.scope.name), 
    ["foochild", "posts", "comments", "comments"]);
});