<template>
<div>

<router-link v-bind:to="'/'">Back to run list</router-link><br/>

<h3>Query</h3>
<div class="rawtex">{{ hi_qry_op }}</div>
<div class="katex">{{ hi_qry_op }}</div>
<button @click="expand_qry = !expand_qry">Toggle graph</button>
<div v-if="expand_qry"  class="mermaid" v-html="hi_qry_tr">
</div>

<h3>Hit</h3>
<div class="rawtex">{{ hi_doc_op }}</div>
<div class="katex">{{ hi_doc_op }}</div>
<button @click="expand_doc = !expand_doc">Toggle graph</button>
<div v-if="expand_doc" class="mermaid" v-html="hi_doc_tr">
</div>

</div>
</template>

<script>
import util from './node_modules/util';
export default {
	watch: {
		'expand_qry': function (newVal) {
			if (newVal === true) {
				var vm = this;
				setTimeout(() => {
					vm.renderMermaid();
				}, 300);
			}
		},
		'expand_doc': function (newVal) {
			if (newVal === true) {
				var vm = this;
				setTimeout(() => {
					vm.renderMermaid();
				}, 300);
			}
		}
	},
	data: function () {
		return {
			hi_qry_op: '',
			hi_doc_op: '',
			hi_qry_tr: '',
			hi_doc_tr: '',
			expand_qry: true,
			expand_doc: true
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
		this.updateResults();
	},
	methods: {
		renderMermaid: function () {
			mermaid.init(undefined, ".mermaid");
		},
		renderMath: function () {
			$('.katex').each(function() {
				var txt = $(this).text();
				var ele = $(this).get(0);
				katex.render(txt, ele);
			});
		},
		send_json: function (url, callbk) {
			$.ajax({
				type : "GET",
				url : url,
				contentType: "application/json; charset=utf-8",
				dataType: "json",
			}).done(function (json) {
				callbk(json);
			});
		},
		updateResults: function () {
			var vm = this;
			const url_op = util.format('/get/%s/%s/%s/highlight_operands.json',
				vm.$route.params.run,
				vm.$route.params.qry,
				vm.$route.params.doc
			);
			const url_tr = util.format('/get/%s/%s/%s/highlight_trees.json',
				vm.$route.params.run,
				vm.$route.params.qry,
				vm.$route.params.doc
			);
			this.send_json(url_op, function (json) {
				vm.hi_qry_op = json['qry'];
				vm.hi_doc_op = json['doc'];
				setTimeout(() => {
					vm.renderMath();
				}, 600);
			});
			this.send_json(url_tr, function (json) {
				vm.hi_qry_tr = json['qry'];
				vm.hi_doc_tr = json['doc'];
				setTimeout(() => {
					vm.renderMermaid();
				}, 600);
			});
		}
	}
};
</script>
<style>
.optr_color_Maroon rect {
	fill: #daa5a5;
}
.optr_color_Green rect {
	fill: Green;
}
.optr_color_Orange rect {
	fill: Orange;
}
div.katex {
	padding: 15px 0 15px 0;
}
div.rawtex {
	width: 100%;
}
</style>
