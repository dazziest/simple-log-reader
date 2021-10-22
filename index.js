Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().replace('Z', '');
});

$(function (argument) {
	let now = new Date()
	var main = $("#main")
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
	var moreFilter = $("#more-filter")
	var sticky = $("#sticky")
	var startDate
	var endDate
	var searchText = ""
	var moreText = ""

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

	moreFilter.on('change', e=>{
		moreText = e.currentTarget.value
		let isShowMoreDisabled = moreText

		showMore.attr("disabled", isShowMoreDisabled)
	})

	apply.on('click', e=>render())
	showWrap.on('change', e=>{
		if($(e.target).is(':checked')){
			output.addClass("wrap")
		} else {
			output.removeClass("wrap")
		}
	})

	sticky.on('change', e=>{
		if($(e.target).is(':checked')){
			main.addClass("sticky")
		} else {
			main.removeClass("sticky")
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

	function hide(e, index){
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
		deleted(index)
	}

	function pretty(e){
		let target = $(e.target)
		if(!target.data().pretty && !target.is('pre')){
			let text = target.text().replaceAll(/\\"/g, '"').replaceAll("'", '"')
			let content = JSON.parse(text)
			let pre = $('<pre></pre>');
			pre.append(JSON.stringify(content, null, 2))
			target.empty()
			target.append(pre)
			target.attr('data-pretty', true)
		}
	}

	function getLogType(header){
		switch (true) {
			case header.indexOf("Info]") > -1:
				return "info"
			case header.indexOf("Error]") > -1:
				return "error"
			case header.indexOf("Warnings]") > -1:
				return "warning"
			case header.indexOf("Debug]") > -1:
				return "debug"
			default:
				return "info"
		}
	}

	function parser(str){
		let dirtyLogs = str.split(/\n/)
		let header
		let info = ""
		let logs = []
		let index = 0

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
							if(infoObj.Key) {
								infoObj.Key = infoObj.Key.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
									return '&#'+i.charCodeAt(0)+';';
								})
							}
							if (infoObj.CURL){
								infoObj.CURL = infoObj.CURL.replaceAll('\"', "'").replaceAll('\n', '')
								infoObj.CURL = infoObj.CURL.replaceAll('-H', '<br>&nbsp;&nbsp;&nbsp;&nbsp;-H')

								if(infoObj.CURL.indexOf('[') > -1 && infoObj.CURL.indexOf(']') > -1) {
									infoObj.CURL = infoObj.CURL.replaceAll('[', "<span class='pretty'>[")
									infoObj.CURL = infoObj.CURL.replaceAll("]'", "]</span>")
								} else {
									infoObj.CURL = infoObj.CURL.replaceAll('{', "<span class='pretty'>{")
									infoObj.CURL = infoObj.CURL.replaceAll("}'", "}</span>")
								}
							}
							let wrapper = `<div>ℹ️ More info:`
							for(var key in infoObj) {
								let value = Object.keys(infoObj[key]).length ? JSON.stringify(infoObj[key], null, 4) : infoObj[key]
								wrapper += `<div>${key}: ${value}</div>`
							}
							wrapper += `</div>`
							log.info = wrapper
						} catch(e){
							log.info = info
						}
					} else if (info.indexOf("More info") > -1) {
						log.info = info
					}
					index = index + 1
					log.date = header.split(new RegExp("⚫️|🔴|🔶|🔵|⚪️"))[0].replace(/\[|\]/, '').trim()
					log.header = header
					log.isNetwork = /https:\/\//.test(header)
					log.isSocket = /socket/i.test(header)
					log.info = log.info || ""
					log.type = getLogType(header)
					log.index = index
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
				return
			}
		}

		let textToRender = $("<div></div>");
		let first = getMomentDate(options.start || startDate || logs[0].date)
		let last = getMomentDate(options.end || endDate || logs[logs.length - 1].date)
		
		start.val(first.toDate().toDateInputValue())

		end.val(last.toDate().toDateInputValue())

		result = null

		logs.forEach(item=>{
			if(item.isNetwork && !isShowNetwork){
				return
			}
			if(item.isSocket && !isShowSocket){
				return
			}
			if(isDeleted(item.index)){
				return
			}


			let date = getMomentDate(item.date)

			if(date.isAfter(last) || date.isBefore(first)){
				return
			}

			let info = $(`<div>${item.info}</div>`);
			let header = $(`<div class="item ${item.type}">${item.header}</div>`);
			let remove = $(`<span class="action" style="color: red">&#10006;</span>`);

			info.find('.pretty').on('click', pretty)

			header.prepend(remove)

			remove.on('click', e => {
				hide(e, item.index)
			})

			if(isShowMore || (moreText && (item.header.indexOf(moreText) > -1 || item.info.indexOf(moreText)> -1 ))){
				header.append(info)
			} else if(item.info) {
				header.append(info)
				header.addClass('hidden')
				header.on('click', expand)
			}

			if(contains(searchText, item)){
				result = result || header
			} else if (searchText) {
				header.addClass('grayed')
			}

			textToRender.append(header)
		})

		if(result){
			setTimeout(()=>{
				result.get(0).scrollIntoView({
		            behavior: 'auto',
		            block: 'center',
		            inline: 'center'
		        })
			}, 1000)
		}

		output.html(textToRender)
	}

	function contains(searchText = "", {header, info}){
		if (searchText.length <= 0) 
			return false

		let reg = new RegExp(searchText)
		return reg.test(header) || reg.test(info)
	}

	function isDeleted(index){
		let deletedItems = deleted()

		return deletedItems.includes(index + "")
	}

	function deleted(index) {
		let items = (sessionStorage.getItem("deleted") || "").split(",")
		if(index){
			if(!items.includes(index + "")){
				items.push(index)

				var deletedData = items.join(",")
				sessionStorage.setItem("deleted", deletedData)
			}
		} else {
			return items
		}
	}
	
	render()
})