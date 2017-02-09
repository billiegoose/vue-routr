import Router from 'routr'
import { createHashHistory, createBrowserHistory, createMemoryHistory } from 'history'
import Vue from 'vue'

var history, routr

// Simplify instantiating the history module for peeps
function autoPickHistory (value) {
	if (value === 'hash') return createHashHistory()
	if (value === 'pushState') return createBrowserHistory()
	if (value === 'virtual') return createMemoryHistory()
	throw new Error(`Invalid value '${value}' for 'history' option in vue.$routr`)
}

// Create a reactive property that is protected from writing by the module closure.
const _state = new Vue({
	data: {
		routr: {}
	}
})

// Export a Vue mixin
export default {
	computed: {
		// I went ahead and put a sigil at the front just to signal that it isn't a normal property.
		$routr () {
			return _state.routr
		}
	},
	routr: {
		// Users can specify which kind of History environment to create.
		history: 'pushState',
		// If the user doesn't provide any routes, use this catch-all route so they get query parameter parsing etc
		routes: [{name: '*', path: '*'}]
	},
	// Vue 1.x
	init () {
		this.init()
	},
	// Vue 2.x
	beforeCreate () {
		this.init()
	},
	methods: {
		// Convenience method
		$navigate (url, state) {
			history.push(url, state)
		},
		init () {
			// Set up the thing that will react when the URL changes
			history = autoPickHistory(this.$options.routr.history)
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
	},
}
