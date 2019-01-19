import Vue from 'vue'
import VueRouter from 'vue-router'
import approachTREC from './app.vue'
import routeURIList from './route-urilist.vue'
import routeResults from './route-results.vue'
import routeJudged from './route-judged-results.vue'
import routeHighlight from './route-highlight.vue'
import routePerfect from './route-perfect-results.vue'

Vue.use(VueRouter)

const router = new VueRouter({
	mode: 'history',
	routes: [
		/* ==== direct version ==== */
		{
			path: '/',
			component: routeURIList
		},
		{
			path: '/:run/:qry/page/:page',
			component: routeResults
		},
		{
			path: '/:run/:qry/judged',
			component: routeJudged
		},
		{
			path: '/:run/:qry/:doc/highlight',
			component: routeHighlight
		},
		{
			path: '/:qry/perfect',
			component: routePerfect
		},
		/* ==== prefix version ==== */
		{
			path: '/:route/',
			component: routeURIList
		},
		{
			path: '/:route/:run/:qry/page/:page',
			component: routeResults
		},
		{
			path: '/:route/:run/:qry/judged',
			component: routeJudged
		},
		{
			path: '/:route/:run/:qry/:doc/highlight',
			component: routeHighlight
		},
		{
			path: '/:route/:qry/perfect',
			component: routePerfect
		}
	]
})

new Vue({
  el: '#approach-trec',
  router,
  render: h => h(approachTREC)
})
