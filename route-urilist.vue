<template>
<div>
<p>TREC evaluation results viewer</p>
<ul>
	<li>
		Source code snapshot: <a href="https://github.com/approach0/search-engine/tree/ecir2019">Github link</a>
	</li>
	<li v-for="item in filelist">
		Dataset file: <a v-bind:href="'./trecfiles/' + item" :download="item">{{item}}</a>
	</li>
	<li v-for="item in download">
		Evaluation file: <a v-bind:href="'./trecfiles/' + item" :download="item">{{item}}</a>
	</li>
	<li v-for="item in runlist">
		View run/query:
		<router-link v-bind:to="item.runid + '/' +  item.qryid + '/page/1'">
			{{item.runid}}/{{item.qryid}}
		</router-link>
		<span> --- </span>
		<router-link v-bind:to="item.runid + '/' +  item.qryid + '/judged'">
			[judged-only]
		</router-link>
		<span> --- </span>
		<router-link v-bind:to="item.qryid + '/perfect'">
			[perfect]
		</router-link>
	</li>
</ul>
</div>
</template>

<script>
export default {
	data: function () {
		return {
			'filelist': [],
			'runlist': []
		};
	},
	created: function () {
		var vm = this;
		$.ajax({
			type : "GET",
			url : "get/index.list",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
		}).done(function (json) {
			console.log(json);
			vm.filelist = json['filelist'];
			vm.runlist = json['runlist'];
			vm.download = json['download'];
		});
	}
};
</script>
