<template>
<div>
<h5>Query ID:</h5> {{ $route.params.qry }}
<h5>Query raw:</h5> {{ qrytex }}
<h5>Query rendered:</h5> [imath] {{ qrytex }} [/imath]

<div class="results">
<router-link v-bind:to="'/' + $route.params['route'] + '/'">Back to run list</router-link><br/>
<router-link v-if="page > 1" v-bind:to="pageUri(-1)">&lt;&lt; Prev Page</router-link>
<router-link v-if="page < totpages" v-bind:to="pageUri(1)">Next Page &gt;&gt;</router-link>
<ul>
	<li v-for="hit in results">
		<span v-if="hit">
		<b>rank</b>: {{hit.rank}}, <b>judge_rel</b>: {{hit.judge_rel}},
		<b>docid</b>: {{hit.docid}}, <b>score</b>: {{hit.score}},
		<router-link v-bind:to= "'/' + $route.params['route'] +
		'/' + $route.params.run + '/' + $route.params.qry + '/' + hit.docid + '/highlight'">
		[highlight]
		</router-link>
		<blockquote
		v-bind:class="{fullrele: hit.judge_rel >= 3, partrele: hit.judge_rel > 0}">
		[imath] {{ hit.tex }} [/imath]
		</blockquote>
		</span>
		<span v-else> Undefined </span>
	</li>
</ul>
<router-link v-if="page > 1" v-bind:to="pageUri(-1)">&lt;&lt; Prev Page</router-link>
<router-link v-if="page < totpages" v-bind:to="pageUri(1)">Next Page &gt;&gt;</router-link>
</div>

<div style="height: 1000px; background-color: #fffafa;"></div>

</div>
</template>

<script>
import util from './node_modules/util';

export default {
	data: function () {
		return {
			'qrytex': '',
			'qryid': 'Unloaded',
			'results': [],
			'page': 0,
			'totpages': 0
		};
	},
	beforeRouteUpdate (to, from, next) {
		this.name = to.params.name;
		next();
		
		this.updateResults();
		console.log('Route updated.');
	},
	mounted: function () {
		console.log('mounted.');
		renderMath();

		this.updateResults();
	},
	methods: {
		updateResults: function () {
			const route = this.$route.params['route'];
			const runid = this.$route.params.run;
			const qryid = this.$route.params.qry;
			const page  = this.$route.params.page;
			var url = util.format('/%s/get/%s/%s/page/%s', route, runid, qryid, page);
			var vm = this;

			$.ajax({
				type : "GET",
				url : url,
				contentType: "application/json; charset=utf-8",
				dataType: "json",
			}).done(function (json) {
				console.log(json);
				vm.qryid = json['qryid'];
				vm.qrytex = json['qrytex'];
				vm.results = json['res'];
				vm.page = parseInt(json['page']);
				vm.totpages = parseInt(json['total_pages']);

				renderMath();
			});
		},
		pageUri: function (incr) {
			const route = this.$route.params['route'];
			var runid = this.$route.params.run;
			var qryid = this.$route.params.qry;
			var page  = parseInt(this.$route.params.page);
			var nextPage = (page + incr);
			return util.format('/%s/%s/%s/page/%d', route, runid, qryid, nextPage);
		}
	}
};

function renderMath() {
	var element = $(document).get(0);
	setTimeout( () => {
		MathJax.Hub.Queue(
			["Typeset", MathJax.Hub, element]
		);
	}, 200);
}
</script>
<style>
blockquote {
	background-color: #ddd;
	padding-left: 10px;
}
blockquote.fullrele {
	background-color: #ffb0b0 !important;
}
blockquote.partrele {
	background-color: #ffeaea;
}
div.results {
	margin-top: 20px;
}
</style>
