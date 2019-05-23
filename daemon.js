var process = require('process');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var fs = require('fs');
var readline = require('readline');
var util = require('util');
var history = require('connect-history-api-fallback'); // handle refresh for SPA

const doc_list_file   = "corpus.txt"
const topic_list_file = "topics.txt"
const judge_list_file = "judge.dat"

const run_file_list = ['uni-beta-1.dat', 'dist-2-beta-98.dat', 'dist-3-beta-90-4.dat', 'tangent-s.dat', 'mcat-nowgt-unif.dat']
const run_file_dirs = ['a', 'b']
const extra_download_file_list = ['eval-dat.tar.gz', 'runtime-dat.tar.gz', 'tangent-s-complete.dat', 'mcat-nowgt-unif-complete.dat']

const RES_PER_PAGE = 100

var doc = {}
var qry = {}
var judge = {}
var run = {
	/* 'foo': {
		"qry-1": {
			"0": {
				"score": "0.05",
				"docid": "Convex_function:94"
			}
		}
	} */
}

var highli_trees = {}
var highli_operands = {}

var promise_docs = read_trecfile(doc_list_file, function (line) {
	parse_key_tex_line(line, doc);
});

var promise_topics = read_trecfile(topic_list_file, function (line) {
	parse_key_tex_line(line, qry);
});

var promise_judges = read_trecfile(judge_list_file, function (line) {
	var fields = line.split(' ');
	var qryid = fields[0];
	var docid = fields[2];
	var rel = fields[3];

	if (!(qryid in judge)) {
		judge[qryid] = {};
	}
	judge[qryid][docid] = rel;
});

Promise.all([promise_docs, promise_topics, promise_judges]).then(() => {
	console.log('Start reading run files...');
	loadRunFiles().then(() => {
		console.log('listening on port ' + port);
	});
});

app.use(history({verbose: true}));
app.use(express.static('dist'));
app.use('/trecfiles', express.static('trecfiles'))
app.use(bodyParser.json());
const port = 3838;
app.listen(port);

app.get('/get/index.list', function (req, res) {
	const runlist = [];
	for (var runid in run) {
		for (var qryid in run[runid]) {
			var run_qry = {'runid': runid, 'qryid': qryid};
			runlist.push(run_qry);
		}
	}
	const filelist = [doc_list_file, topic_list_file, judge_list_file];
	const download = extra_download_file_list.slice();
	const run_files = list_trec_files();
	for (var i = 0; i < run_files.length; i++) {
		download.push(run_files[i]);
	};
	
	res.json({
		"runlist": runlist,
		"filelist": filelist,
		"download": download,
	});

}).get('/get/:qry/query.tex', function (req, res) {
	const qryid = req.params.qry;
	res.json({"qrytex": qry[qryid]});

}).get('/get/:run/:qry/latex.list', function (req, res) {
	const runid = req.params.run;
	const qryid = req.params.qry;
	const qryres = run[runid][qryid];
	latexlist = '';

	for (var i = 1; i <= Object.keys(qryres).length; i++) {
		if (i in qryres) {
			latexlist += qryres[i]['docid'] + '\t' + qryres[i]['tex'] + '\n';
		}
	}

	res.setHeader('content-type', 'text/plain; charset=utf-8');
	res.send(latexlist);

}).get('/get/:run/:qry/judged', function (req, res) {
	const runid = req.params.run;
	const qryid = req.params.qry;
	const qryres = run[runid][qryid];
	const results = [];

	/* fix tangent-S query-22 */
	var L = Object.keys(qryres).length;
	if (L > 1000) L = 1000;

	/* put results in a temporary list for reranking */
	const tmp_results = [];
	for (var i = 1; i <= L; i++) {
		if (i in qryres) {
			tmp_results.push(qryres[i]);
		} else {
			tmp_results.push(undefined);
		}
	}
	trec_rerank(tmp_results);

	/* now we have the corrected rank, extract those judged */
	for (var i = 0; i < tmp_results.length; i++) {
		if (tmp_results[i]['judge_rel'] != "not judged")
			results.push(tmp_results[i]);
	};

	res.json({
		"res": results,
		"qryid": qryid,
		"qrytex": qry[qryid]
	});

}).get('/get/:qry/perfect', function (req, res) {
	const qryid = req.params.qry;

	/* put results in a temporary list for reranking */
	var results = [];
	Object.keys(judge[qryid]).forEach((docid) => {
		results.push({
			"docid": docid,
			"tex": doc[docid] || '',
			"score": judge[qryid][docid],
			"judge_rel": judge[qryid][docid]
		});
	});
	trec_rerank(results);

	res.json({
		"res": results,
		"qryid": qryid,
		"qrytex": qry[qryid]
	});

}).get('/get/:run/:bound/judge.dat', function (req, res) {
	const runid = req.params.run;
	const bound = req.params.bound;
	response = '';

	if (bound !== "upperbound" && bound !== "lowerbound") {
		res.setHeader('content-type', 'text/plain; charset=utf-8');
		res.send('incorrect usage.');
	}

	Object.keys(run[runid]).forEach((qryid) => {
		const fields = qryid.split(/(\d+)/);
		const qryres = run[runid][qryid];
		const qrynum = parseInt(fields[3])
		if (qrynum > 20) return;

//		console.log(qryid)
//		console.log(Object.keys(qryres).length)

		for (var i = 1; i <= Object.keys(qryres).length; i++) {
			const r = qryres[i];
			var judge_score = undefined;
			if (r['judge_rel'] == "not judged") {
				if (bound === "upperbound")
					judge_score = "4.0"
				else /* lowerbound */
					judge_score = "0.0"
			} else {
				judge_score = r['judge_rel']
			}
			response += `${qryid} xxx ${r['docid']} ${judge_score}\n`;
		}
	})

	res.setHeader('content-type', 'text/plain; charset=utf-8');
	res.send(response);

}).get('/get/:run/:qry/page/:page', function (req, res) {
	const runid = req.params.run;
	const qryid = req.params.qry;
	const page = req.params.page;

	const qryres = run[runid][qryid];
	const totpages = Math.ceil(Object.keys(qryres).length / RES_PER_PAGE);
	const start = (page - 1) * RES_PER_PAGE + 1;
	const results = [];
	for (var i = start; i < start + RES_PER_PAGE; i++) {
		if (i in qryres) {
			results.push(qryres[i]);
		} else {
			results.push(undefined);
		}
	};

	trec_rerank(results);
	res.json({
		"page": page,
		"res": results,
		"qryid": qryid,
		"qrytex": qry[qryid],
		"total_pages": totpages
	});
}).get('/get/:run/:qry/:doc/highlight_operands.json', function (req, res) {
	const runid = req.params.run;
	const qryid = req.params.qry;
	const docid = req.params.doc;
	const key = runid + '.' + qryid + '.' + docid;
	const val = highli_operands[key];
	res.json(val);
}).get('/get/:run/:qry/:doc/highlight_trees.json', function (req, res) {
	const runid = req.params.run;
	const qryid = req.params.qry;
	const docid = req.params.doc;
	const key = runid + '.' + qryid + '.' + docid;
	const val = highli_trees[key];
	res.json(val);
});

function list_trec_files()
{
	var trec_files = run_file_list;
	run_file_dirs.forEach((dir) => {
		const ls = fs.readdirSync('./trecfiles/' + dir);
		trec_files = trec_files.concat(ls.map(function (ele) {
			return dir + '/' + ele;
		}))
	})
	return trec_files;
}

function read_trecfile(fname, lineCallbk)
{
	return new Promise((resolve) => {
		var input = fs.createReadStream('./trecfiles/' + fname);
		var rd = readline.createInterface({
			input: input,
			console: false
		});

		rd.on('line', function(line) {
			lineCallbk(line);
		});

		input.on('end', () => {
			console.log(fname + ' loaded.');
			resolve(fname);
		});
		
		input.on('error', () => {
			// console.log(fname + ' not found.');
			resolve(fname);
		});
	});
}

function parse_key_tex_line(line, d)
{
	var fields = line.split('\t');
	var id = fields[0];
	var tex = fields.slice(1).join(' ');
	tex = tex.replace(/% /g, "");
	d[id] = tex;
}

function loadRunFiles () {
	return new Promise((resolve_all) => {
		var promise_runs = [];
		const run_files = list_trec_files();
		for (var i = 0; i < run_files.length; i++) {
			const fname = run_files[i];
			/* read TREC file */
			var p = read_trecfile(fname, function (line) {
				const fields = line.split(/\t| /);
				const qryid = fields[0];
				const docid = fields[2];
				const rank = fields[3];
				const score = fields[4];
				var runid = fields[5];
				if (fname.split('/').length > 1) {
					/* use filename as runID when run file is
					 * in a directory */
					runid = fname.replace('/', '-');
				}
				const doctex = doc[docid] || '';
				var relevance = judge[qryid]  || {};
				relevance = relevance[docid] || 'not judged';

				run[runid] = run[runid] || {};
				run[runid][qryid] = run[runid][qryid] || {};
				run[runid][qryid][rank] = {
					"rank": rank,
					"score": score,
					"docid": docid,
					"tex": doctex,
					"judge_rel": relevance
				}
			}).then(() => {
				// console.log(Object.keys(run));
				// console.log(util.inspect(run, false, null));
			});
			promise_runs.push(p);
			/* read highlight-operands file */
			const hi_oprands_fname = fname + '.' + 'hi-operands.dat'
			promise_runs.push(read_trecfile(hi_oprands_fname, (line) => {
				const j = JSON.parse(line);
				const key = j['key'];
				if (undefined === highli_trees[key]) {
					highli_operands[key] = {
						'qry': j['qry'],
						'doc': j['doc']
					};
				}
			}));
			/* read highlight-trees file */
			const hi_trees_fname   = fname + '.' + 'hi-trees.dat'
			promise_runs.push(read_trecfile(hi_trees_fname, (line) => {
				const j = JSON.parse(line);
				const key = j['key'];
				if (undefined === highli_trees[key]) {
					highli_trees[key] = {
						'qry': j['qry'],
						'doc': j['doc']
					};
				}
			}));
		};
		Promise.all(promise_runs).then(resolve_all);
	});
}

function trec_rerank(res) // return the actually order evaluated by TREC_EVAL
{
	/* in-place sort */
	res.sort(function (a, b) {
		if (Number(a.score) > Number(b.score)) {
			return -1;
		} else if (Number(a.score) == Number(b.score)) {
			return - a.docid.localeCompare(b.docid);
		} else {
			return 1;
		}
	});
	for (var i = 0; i < res.length; i++) {
		if (res[i] != undefined)
			res[i].rank = '' + (Number(i) + 1);
	};
}

process.on('SIGINT', function() {
	console.log('');
	console.log('Bye bye.');
	process.exit( );
})
