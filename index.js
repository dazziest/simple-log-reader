Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().replace('Z', '');
});

$(function (argument) {
	let now = new Date()
	var input = $("#input-file")
	var output = $("#output")
	var apply = $("#apply")
	var showNetwork = $("#network")
	var showSocket = $("#socket")
	var showMore = $("#more")
	var showWrap = $("#wrap")
	var start = $("#start")
	var end = $("#end")
	var startDate
	var endDate

	input.on("change", (e)=>{
		output.empty()
		let file = e.target.files[0]
		let reader = new FileReader()
		reader.onload = res=>{
			parser(res.currentTarget.result)
		}
		reader.readAsText(file)
	})

	start.on('change', e=>{
		startDate = new Date(e.currentTarget.value)
		render({start: startDate})
	})

	end.on('change', e=>{
		endDate = new Date(e.currentTarget.value)
		render({end: endDate})
	})

	apply.on('click', e=>render())
	showWrap.on('change', e=>{
		if($(e.target).is(':checked')){
			output.addClass("wrap")
		} else {
			output.removeClass("wrap")
		}
	})

	function getMomentDate(str){
		let date = moment(str, 'DD/MM/YY HH.mm.ss A')
		if(!date.isValid()){
			date = moment(str, 'DD/MM/YY HH:mm:ss A')
		}
		return date
	}

	function expand(e){
		let target = $(e.target)
		if (target.is(".open")){
			target.removeClass("open")
		} else {
			target.addClass("open")
		}
	}

	function parser(str){
		let dirtyLogs = str.split(/\n/)
		let header
		let info = ""
		let logs = []

		dirtyLogs.forEach((item, i)=>{
			let log = {}
			if (/^\[.[0-9]\/.[0-9]\/.[0-9]+\s+[0-9].+\]/.test(item)){
				if (header) {
					log.date = header.split("⚫️")[0].replace(/\[|\]/, '').trim()
					log.header = header
					log.isNetwork = /https:\/\//.test(header)
					log.isSocket = /socket/i.test(header)
					log.info = info
					logs.push(log)
				}
				header = item
				info = ""
			} else {
				if (!info){
					info = item
				} else {
					info = [info, item].join("\n")
				}
			}
		})

		sessionStorage.setItem("logs", JSON.stringify(logs))

		render({logs: logs})
	}

	function render(options = {}){
		let logs = options.logs || null
		let isShowNetwork = showNetwork.is(":checked")
		let isShowMore = showMore.is(":checked")
		let isShowSocket = showSocket.is(":checked")
		if (!logs){
			let logStr = sessionStorage.getItem("logs")
			if (logStr){
				logs = JSON.parse(logStr)
			} else {
				output.text("No Data")
			}
		}

		let textToRender = $("<div></div>");
		let first = getMomentDate(options.start || startDate || logs[0].date)
		let last = getMomentDate(options.end || endDate || logs[logs.length - 1].date)
		
		start.val(first.toDate().toDateInputValue())

		end.val(last.toDate().toDateInputValue())

		logs.forEach(item=>{
			if(item.isNetwork && !isShowNetwork){
				return
			}
			if(item.isSocket && !isShowSocket){
				return
			}

			// let render = [textToRender, item.header]
			let date = getMomentDate(item.date)

			if(date.isSameOrAfter(last) || date.isBefore(first)){
				return
			}

			let info = $(`<div>${item.info}</div>`);
			let header = $(`<div>${item.header}</div>`);

			if(isShowMore){
				header.append(info)
			} else if(item.info) {
				header.append(info)
				header.addClass('hidden')
				header.on('click', expand)
			}

			textToRender.append(header)
		})

		output.html(textToRender)
	}
})