var Router = require('routr')
var History = require('history')
var Vue = require('vue')

var history, router

// Simplify instantiating the history module for peeps
function autoPickHistory (value, opts) {
	if (value === 'hash') return History.createHashHistory(opts)
	if (value === 'pushState') return History.createBrowserHistory(opts)
	if (value === 'virtual') return History.createMemoryHistory(opts)
	throw new Error(`Invalid value '${value}' for 'history' option in vue.$routr`)
}

// Create a reactive property that is protected from writing by the module closure.
var _state = new Vue({
	data: {
		routr: {}
	}
})

// This is abstracted so we can be compativle with Vue 1.x and Vue 2.x
function init () {
	// Set up the thing that will react when the URL changes
	history = autoPickHistory(this.$options.routr.history, this.$options.routr.historyOptions)
	router = new Router(this.$options.routr.routes)
	// Set the initial location
	this.$nextTick(function () {
		_state.routr = router.getRoute(history.location.pathname + history.location.search + history.location.hash)
	})
	// Listen for future push state events...
	let unlisten = history.listen((location, action) => {
		// and update the reactive vue data.
		_state.routr = router.getRoute(location.pathname + location.search + location.hash)
	})
}

// Export a Vue mixin
Vue.config.optionMergeStrategies.routr = function (toVal, fromVal) {
	return Object.assign({}, toVal, fromVal)
}

module.exports = {
	computed: {
		// I went ahead and put a sigil at the front just to signal that it isn't a normal property.
		$routr () {
			return _state.routr
		}
	},
	routr: {
		// Users can specify which kind of History environment to create.
		history: 'pushState',
		historyOptions: {},
		// If the user doesn't provide any routes, use this catch-all route so they get query parameter parsing etc
		routes: [{name: '*', path: '*'}]
	},
	// Vue 1.x
	init: init,
	// Vue 2.x
	beforeCreate: init,
	methods: {
		// Convenience method
		$navigate (url, state) {
			history.push(url, state)
		},
	},
}
