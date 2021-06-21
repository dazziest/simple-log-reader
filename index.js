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
	var logFilter = $("#logs-filter")
	var startDate
	var endDate
	var searchText = ""

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

	logFilter.on('change', e=>{
		searchText = e.currentTarget.value
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
		let date = null
		if (date = moment(str, 'DD/MM/YY HH.mm.ss A')){
			if (date.isValid()){
				return date
			}
		}
		if (date = moment(str, 'DD/MM/YY HH:mm:ss A')){
			if (date.isValid()){
				return date
			}
		}
		if (date = moment(str, 'DD/MM/YY, HH.mm.ss A')){
			if (date.isValid()){
				return date
			}
		}
		if (date = moment(str, 'DD/MM/YY, HH:mm:ss A')){
			if (date.isValid()){
				return date
			}
		}
		if (date = moment(str, 'MM/DD/YY, HH:mm:ss A')){
			if (date.isValid()){
				return date
			}
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

	function hide(e){
		let invisible = $('<div class="invisible"></div>')
		let target = $(e.target).closest('.item')
		let prev = target.prev('.invisible')
		let next = target.next('.invisible')
		if (prev.length && next.length){
			prev.append(next.children())
			next.remove()
		}
		if(prev.length){
			invisible = prev
		} else if (next.length) {
			invisible = next
		} else {
			invisible.insertBefore(target)
		}

		target.hide("fast", e => {
			target.removeAttr('style')
			target.detach()
			invisible.append(target)
		})
	}

	function pretty(e){
		let target = $(e.target)
		if(!target.data().pretty && !target.is('pre')){
			let content = JSON.parse(target.text().replaceAll(/\\"/g, '"'))
			let pre = $('<pre></pre>');
			pre.append(JSON.stringify(content, null, 2))
			target.empty()
			target.append(pre)
			target.attr('data-pretty', true)
		}
	}

	function parser(str){
		let dirtyLogs = str.split(/\n/)
		let header
		let info = ""
		let logs = []

		dirtyLogs.forEach((item, i)=>{
			let log = {}
			if (/(Info|Error|Warnings|Debug)+\]:/.test(item)){
				if (header) {
					if (info && info.indexOf('{') > -1){
						let infoBody = info.replace('ℹ️ More info:', '').replace(/}\[0m/g, '}')
						try {
							let infoObj = JSON.parse(infoBody)
							if(infoObj.Body){
								infoObj.Body = `<span class='pretty'>${infoObj.Body.replaceAll(/\\"/g, '"')}</span>`
							}
							log.info = `ℹ️ More info:\n${JSON.stringify(infoObj, null, 4)}`
						} catch(e){

						}
					}
					log.date = header.split("⚫️")[0].replace(/\[|\]/, '').trim()
					log.header = header
					log.isNetwork = /https:\/\//.test(header)
					log.isSocket = /socket/i.test(header)
					log.info = log.info || ""
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


			let date = getMomentDate(item.date)

			if(date.isAfter(last) || date.isBefore(first)){
				return
			}

			let info = $(`<div>${item.info}</div>`);
			let header = $(`<div class="item">${item.header}</div>`);
			let remove = $(`<span class="action" style="color: red">&#10006;</span>`);

			info.find('.pretty').on('click', pretty)

			header.prepend(remove)

			remove.on('click', hide)

			if(isShowMore){
				header.append(info)
			} else if(item.info) {
				header.append(info)
				header.addClass('hidden')
				header.on('click', expand)
			}

			if(searchText && (item.header.indexOf(searchText) > -1 || item.info.indexOf(searchText)> -1 )){
				
			} else if (searchText) {
				header.addClass('grayed')
			}

			textToRender.append(header)
		})

		output.html(textToRender)
	}
})