<template>
<div>

<div class="stick-top">
	<h5>{{ $route.params.qry }}</h5> [imath] {{ qrytex }} [/imath]
</div>
<h5>Query raw:</h5> {{ qrytex }}

<div class="results">
<router-link v-bind:to="'/' + $route.params['route'] + '/'">Back to run list</router-link><br/>
<ol>
	<li v-bind:id="hit.docid" v-for="hit in results">
		[<a v-bind:href="'#' + hit.docid">#</a>]
		<span v-if="hit">
			<b>rank</b>: {{hit.rank}}, <b>judge_rel</b>: {{hit.judge_rel}},
			<b>docid</b>: {{hit.docid}}, <b>score</b>: {{hit.score}}
			<router-link v-bind:to="'/' + $route.params['route'] +
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
</ol>
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
			'results': []
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
			var uri = `/${route}/get` + this.JudgedResUri();
			var vm = this;

			$.ajax({
				type : "GET",
				url : uri,
				contentType: "application/json; charset=utf-8",
				dataType: "json",
			}).done(function (json) {
				console.log(json);
				vm.qryid = json['qryid'];
				vm.qrytex = json['qrytex'];
				vm.results = json['res'];

				renderMath();
			});
		},
		JudgedResUri: function (incr) {
			var runid = this.$route.params.run;
			var qryid = this.$route.params.qry;
			return util.format('/%s/%s/judged', runid, qryid);
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
div.stick-top {
	position: fixed;
	top: 0px;
	right: 0px;
	background-color: white;
	border: 1px solid;
	padding: 10px 10px 10px 10px;
}
</style>
