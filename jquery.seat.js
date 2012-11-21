/*
* seat v0.4
* sept 2012
* by scott
* jonahshun@gmail.com 
* */
;(function($){
	$.fn.seat=function(opts){
		var opts=$.extend({},$.fn.seat.settings,opts);
		$.fn.seat.settings=opts;
		return this.each(function(index){
			return new Seat(this,opts);
		});
	};
	var isAndroid = (/android/gi).test(navigator.appVersion),
		isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
		isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),
		hasTouch = 'ontouchstart' in window && !isTouchPad,
		START_EV = hasTouch ? 'touchstart' : 'mousedown',
		MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
		END_EV = hasTouch ? 'touchend' : 'mouseup',
		CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
		CLICK_EV = hasTouch ? 'touchstart' : 'click',
		canselected=0;
	var Seat=function(objDom,op){
		var objDom=$(objDom);
		objDom.addClass('ui-seat-area');
		var maxTop=0,maxLeft=0,minTop=0,minLeft=0,
			_this=this,timehandle,
			settings=$.fn.seat.settings,
			areaid=op.data.area.areaid,venueid=op.data.area.venueid,bgcolor=settings.bgcolor,
			totop=settings.totop*1;toleft=settings.toleft*1;
		var loads=function(objDom,op){
			var fragment =$("<div></div>");
			$.each(op.data.area.s,function(index){
				/* init the data*/
				var chairData=this.v.split(',');
				/* set the top and left*/
				var sTop=parseInt(chairData[3])*op.space-totop;
				var sLeft=parseInt(chairData[4])*op.space-toleft;
				var dom=chair.render({chairda:chairData,aid:areaid,vid:venueid});
				fragment.append(dom);
				/* find the max top and max left*/
				if (sTop > maxTop) {
					maxTop = sTop;
				}
				if (sLeft > maxLeft) {
					maxLeft = sLeft;
				}
			})
			
			objDom.append(fragment.children());
			maxLeft+=settings.space,maxTop+=settings.space;
			objDom.attr("style", "background-color:"+bgcolor+"; height:" + maxTop + "px;width:" + maxLeft + "px;");
			
			/* fly to center*/
			$("html,body").animate({
				scrollTop : maxTop/2,
				scrollLeft : maxLeft/2
			}, 500);
			
		};
		var reload=function(objDom,url){
			if(typeof(url)=='undefined' || url==''){
				window.clearTimeout(timehandle);
			}else{
				$.getJSON(url,function(re){
					var update_data=re.data;
					objDom.attr("match", "0");
					var serie_data=datasplit.run(update_data);
					$.each(update_data,function(index){
						var status=this.substring(0, 1);
						var seat_no=this.substring(1);
						var cseat=$("#s_"+seat_no+"_"+re.areaid+"_"+re.venueid);
						cseat.attr('match','1');
						if(cseat.attr('flag')=='false'){
							var p=(cseat.attr('xy')).split('|');
							var da=(cseat.attr('data')).split(',');
							var chairData=[seat_no,da[1],status,p[0],p[1],da[3],da[4],da[5],'',5,re.areaid,''];
							var dom=chair.render({chairda:chairData,aid:re.areaid,vid:re.venueid});
							cseat.replaceWith(dom);
						}
					})
				})
			}
		};

		loads(objDom,op);
		var interval=parseInt($.fn.seat.settings.update.interval);
		var updateurl=$.fn.seat.settings.update.url;
		if(interval>0){
		timehandle=	setInterval(function() {
				reload(objDom,updateurl);
			}, interval)
		};
		return objDom;
	};
	
	var chair=function(){
		var _render=function(value){
			var dom=$($.fn.seat.settings.tpl);
			dom=_createseat(value,dom);
			return dom;
		};
		var _eventStart=function(){
			canselected=1;
		}
		var _moveev=function(e){
			e=hasTouch?e.originalEvent.touches[0]|| e.originalEvent.changedTouches[0]:e;
			e.preventDefault();
			//e.stopPropagation();
			canselected=0;
		}
		var _clickonme=function(e){
			if(hasTouch && canselected==0) return false;
			var settings=$.fn.seat.settings,
				selectedCls=settings.seatcls.selected, available=settings.seatcls.available,tao=settings.seatcls.tao,
				bgcolor=settings.bgcolor;color_p=settings.colorprice, limit=settings.limit;
				limit=(limit*1)<0?6:parseInt(limit);
			var da=$(this).attr("data"),action='';
			if (!$(this).hasClass(selectedCls)) { /*the seat can be selected*/
				if(limit!=0 && seatstore.data.length<limit ){
					var rmCls=available+' '+tao
					$(this).removeClass(rmCls).addClass(selectedCls);
					$(this).attr("flag", "true").css("background-color",bgcolor);
					seatstore.add(da);
					action='add';
				}else{
					alert("Seat limited in "+limit);
				}
			}else{
				$(this).attr("flag", "false");
				$(this).removeClass(selectedCls);
				//is tao
				if($(this).attr('istao')=='1'){
					$(this).addClass(tao);
				}else{
					$(this).addClass(available);
					// get the price color
					var data=$(this).attr("data").split(",");
					//reset the background color
					$(this).css("background-color",color_p[data[1]]);
				}
				seatstore.del(da);
				$(this).attr("flag", "false");
				action='del';
			}

			//return the selected data
			var operatedata={da:da,act:action};
			$.fn.seat.settings.result(seatstore.data,operatedata);
			canselected=0;
			 
		}
		var _res=function(da){
			alert(da);
		}
		var _hover=function(obj,data){
			obj.hover(function(){
				//alert($(this).parent().attr('class'));
				if($(this).find(".title").length<1){
					$(this).append('<div class="title" style="position:relative;width:100px;height:20px;padding:0px;line-height:20px;text-align:center;top:-47px;left:-35px;background-color:#fff;border:1px solid #ccc;z-index:9999">'+data+'</div>');
				}else{
					$(this).find('.title').show();
				};
			},function(){
				$(this).find(".title").hide();
			})
			return obj;
		}
		var _hEvent=function(obj){
				if(hasTouch){/* if it's a touch device, we need to add 2 events instead of click event*/
					obj.bind(START_EV,_eventStart);
					obj.bind(END_EV,_clickonme);
					obj.bind(MOVE_EV,_moveev);
				}else{
					obj.bind('click',_clickonme);
				}
		}
		/* initdata: data for all seet,obj: seat template, availabledata: some available data */
		var _createseat=function(initdata,obj){
			/* selected,available,lock,sold,tao */
			var data=initdata.chairda,
				settings=$.fn.seat.settings,space=settings.space, 
				availableSeat=settings.seatcls.available,soldSeat=settings.seatcls.sold,taoSeat=settings.seatcls.tao, 
				showtitle=settings.title, bgcolor=settings.bgcolor,totop=settings.totop*1;toleft=settings.toleft*1,
				sTop=parseInt(data[3])*space-totop,
				sLeft=parseInt(data[4])*space-toleft,
				sid='s_'+data[0]+'_'+initdata.aid+'_'+initdata.vid;
			if(typeof(data[2])=='undefined') data[2]==0;
			var or_data = data[0]+","+data[1]+","+data[2]+"," + data[5] + "," + data[6] + ","+ data[7] +","+ initdata.aid;
			obj.addClass('ui-seat');
			obj.attr('flag','false');
			switch(data[2]){
				case '2': // the seat can be sold
						var colorp=$.fn.seat.settings.colorprice[data[1]];
						obj.css({'top':sTop+'px','left':sLeft+'px','background-color':colorp});
						obj.addClass(availableSeat);
						obj.attr({'id':sid,'xy':data[3]+'|'+data[4],'data':or_data});
						_hEvent(obj);/* binding some events*/
						if(showtitle==true)
						obj=_hover(obj,"Row "+data[5]+" NO "+data[6]+ " ￥"+data[7]);
						break;
				case '4': //for season tickets	
						obj.css({'top':sTop+'px','left':sLeft+'px','background-color':bgcolor});
						obj.addClass(taoSeat);
						or_data=or_data+',istao';
						obj.attr({'id':sid,'xy':data[3]+'|'+data[4],'istao':'1','taoid':data[9],'data':or_data});		
						_hEvent(obj);
						if(showtitle==true)
						obj=_hover(obj,"Row "+data[5]+" NO "+data[6]+" Season Ticket");
						break;
				case '0':
				defualt ://the seats are expired
						obj.css({'top':sTop,'left':sLeft,'background-color':bgcolor});
						obj.addClass(soldSeat);
						obj.attr({'id':sid,'xy':data[3]+'|'+data[4],'data':or_data});
				break;
			}
			return obj;
		}
		return {
			render:function(value){
				return _render(value);
			}
		}
	}();

	var datasplit={
		run:function(value){
		this.data = new Object();
		var len = value.length;
		for (var i = 0; i < len; i++) {
			this.data["" + value[i].substring(1)] = value[i].substring(0, 1)
		}
		},
		data:null
	};
	var seatstore={
		add:function(da){
			if($.inArray(da,this.data)==-1){
				this.data.push(da);
			}
		},
		del:function(da){
			var index=$.inArray(da,this.data);
			if(index>-1){
				this.data.splice(index,1);
			}
		},
		data:new Array()
	};
	$.fn.seat.settings={
			tpl:'<div class="tpl" style="background-color: black; width: 20px; height: 20px; "></div>',
			bgcolor:'#000',
			toleft:0,
			totop:0,
			data:{
				area:{
					fnames:"Stand 12",
					s:[{"v": "1,0,0,7,44,1,1,1.00,0,0,0,"},{
						"v": "2,0,0,7,39,1,2,1.00,0,0,0,"},{
						"v": "3,0,0,8,44,2,1,1.00,0,0,0,"}
						]
					}
				},
			title:false,
			colorprice:['#FFFF00','#0101DF','#3ADF00','#FA5858'],
			mapurl:"http://www.gzhtml5.com",
			seatcls:{'selected':'selected','available':'available','lock':'lock','sold':'sold','tao':'tao'},
			space:25,
			limit:6,
			result:function(da,re){},
			update:{interval:0,url:'js/update.json'}
	};
})(jQuery);
