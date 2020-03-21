/* 
	Author	: Fluffy88
	Website : http://fluffy88.com
	Rewritten by : dalesmckay
	Turkish translate & organizing : Broken Castle & Trafik
	Blog (Broken Castle) : https://burakdemirerblog.wordpress.com
*/

if(premium==false){alert('Bu scripti çalıştırmak için premium hesabınız olması gerekir.');end();}
function fnInjectOverviewBar(){
	/* Default to your own currently active village */
	var defaultCoords = fnExtractCoords(win.$("title").html());
	
	/* Default to midnight of next day */
	var defaultDate = new Date();
	defaultDate.setTime(((Math.floor(defaultDate.getTime()/msPerDay)+1)*minsPerDay + defaultDate.getTimezoneOffset())*msPerMin);
	defaultDate = defaultDate.toString().replace(/\w+\s*/i,"").replace(/(\d*:\d*:\d*)(.*)/i,"$1");
	
	/* Perform the injection */
	fnInjectUnits();
	win.$('<tr><td colspan="3"><b>Hedef Köy: </b><input id="snipe_coord" value="'+defaultCoords+'" class="text-input inactive" size="7" onFocus="this.select()" /></td><td colspan="1"> <font title="Aylar sirasiyla; Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec"><b>Zaman:</b></font> <input id="arrival_time" size="25" class="text-input inactive" value="'+defaultDate+'" onFocus="this.select()" /></td><td> <input type="button" value="Hesapla" onClick="fnCalculateBackTime()" /></td></tr>').insertAfter(win.$('#menu_row2'));
	win.$('<div id="snipe_output"><span style=\"color:red;font-weight:bold\"><center>SALDIRI PLANLAYICISI</center></span><span style=\"color:green;font-weight:bold\"><center><sub>Broken Castle & Trafik tarafından düzenlenmiştir</sub></center></span><br/></div>').insertAfter(win.$('body'));
}

function fnExtractCoords(src){
	var vv=src.match(/\d+\|\d+/ig);
	return (vv?vv[vv.length-1]:null);
}

function fnCalculateDistance(to,from){
	var target = fnExtractCoords(to).match(/(\d+)\|(\d+)/);
	var source = fnExtractCoords(from).match(/(\d+)\|(\d+)/);
	var fields = Math.sqrt(Math.pow(source[1]-target[1],2)+Math.pow(source[2]-target[2],2));
	
	return fields;
}

function fnDebugLog(msg){win.$("body").append("<span>"+msg+"</span><br/>");}

function fnAjaxRequest(url,sendMethod,params,type){
	var error=null,payload=null;

	win.$.ajax({
		"async":false,
		"url":url,
		"data":params,
		"dataType":type,
		"type":String(sendMethod||"GET").toUpperCase(),
		"error":function(req,status,err){error="ajax: " + status;},
		"success":function(data,status,req){payload=data;}
	});

	if(error){
		throw(error);
	}

	return payload;
}

function fnCreateConfig(name){return win.$(fnAjaxRequest("/interface.php","GET",{"func":name},"xml")).find("config");}
function fnCreateUnitConfig(){return fnCreateConfig("get_unit_info");}
function fnCreateWorldConfig(){return fnCreateConfig("get_config");}

function fnCalculateLaunchTime(source,target,unit,landingTime){
	var distance = fnCalculateDistance(target,source);
	var unitSpeed = unitConfig.find(unit+" speed").text();

	/* Convert minutes to milli-seconds */
	var unitTime = distance*unitSpeed*msPerMin;
	
	/* Truncate milli-second portion of the time */
	var launchTime = new Date();
	launchTime.setTime(Math.round((landingTime.getTime() - unitTime)/msPerSec)*msPerSec);

	return launchTime;
}

function fnWriteCookie(ele){
	var snipeConfig="";

	win.$("#combined_table tr:first th img[src*=unit_]").each(function(i,e){
		snipeConfig+=win.$("#view_"+e.src.match(/unit\_(.+)\.png?/i)[1]).is(':checked')?"1":"0";
	});

	var cookie_date=new Date(2099,11,11);
	win.document.cookie='$snipe='+snipeConfig+';expires='+cookie_date.toGMTString();
}

function fnInjectUnits(){
	var twCookie=win.document.cookie.match(/\$snipe\=([0|1]*)/i);
	if(twCookie){
		twCookie=twCookie[1];
		for(var ii=0;ii<twCookie.length;ii++){
		}
	}

	win.$("#combined_table tr:first th img[src*=unit_]").each(function(i,e){
		if(this.parentNode.nodeName=="A")
		{
			win.$('<input type="checkbox" '+((!twCookie||(twCookie[i]=="1"))?'checked="true"':'')+' id="view_'+e.src.match(/unit\_(.+)\.png?/i)[1]+'" OnClick="fnWriteCookie(this);"/>').insertBefore(win.$(this.parentNode));
		}
		else
		{
			win.$('<input type="checkbox" '+((!twCookie||(twCookie[i]=="1"))?'checked="true"':'')+' id="view_'+e.src.match(/unit\_(.+)\.png?/i)[1]+'" OnClick="fnWriteCookie(this);"/>').insertBefore(win.$(this));
		}
	});
	win.$("#combined_table tr:first th:has(img[src*=unit_])").attr("style","background-color:yellow");
}
	
function fnExtractUnits(){
	var units=[];

	win.$("#combined_table tr:first th img[src*=unit_]").each(function(i,e){
		units.push(e.src.match(/unit\_(.+)\.png?/i)[1]);
	});
	
	return units;
}
	
function fnCalculateBackTime(){
	var worldConfig = fnCreateWorldConfig();
	var hasChurch = worldConfig && parseInt(worldConfig.find("game church").text()||"0", 10);
	/*var arrivalTime = new Date(win.$("#arrival_time").attr("value").split(":").slice(0,3).join(":"));
	var target = win.$("#snipe_coord").attr("value");*/
	var arrivalTime = new Date(document.getElementById("arrival_time").value.split(":").slice(0,3).join(":"));
	var target = document.getElementById("snipe_coord").value;
	var servertime = win.$("#serverTime").html().match(/\d+/g);
	var serverDate = win.$("#serverDate").html().match(/\d+/g);
	serverTime = new Date(serverDate[1]+"/"+serverDate[0]+"/"+serverDate[2]+" "+servertime.join(":"));
	var output = [];
	var ii,troop_count,source,launchTime;
	var units=fnExtractUnits();
	
	/* Loop through your own villages */
	win.$("#combined_table tr:gt(0)").each(function(i,e){
		source = fnExtractCoords($(this).find("td:eq(1)").html());		
		if(source != target){
			var isVisible = false;
			
			/* Process Each Unit */
			for(ii=0;ii<units.length;ii++){
				if(win.$("#view_"+units[ii]).is(':checked')){
					troop_count = parseInt($(this).find("td:eq("+(ii+(hasChurch?9:8))+")").text(),10);
				
					/* Do we have Units currently Available */
					if(troop_count > 0){
						launchTime=fnCalculateLaunchTime(source,target,units[ii],arrivalTime);

						/* Cache Units that can reach the target on time */
						if(launchTime.getTime() > serverTime.getTime()){
							isVisible = true;							
														
							var kontrol1 = units.indexOf("archer");
							var kontrol2 = units.indexOf("knight");

							if ( kontrol1 == "-1" && kontrol2 == "-1" )
								{var unitss=["Mızrak","Kılıç","Balta","Casus","Hafif","Ağır","Şah","Man","Misyoner"];}
							else if ( kontrol1 == "-1" )
								{var unitss=["Mızrak","Kılıç","Balta","Casus","Hafif","Ağır","Şah","Man","Şövalye","Misyoner"];}
							else if ( kontrol2 == "-1" )
								{var unitss=["Mızrak","Kılıç","Balta","Okçu","Casus","Hafif","A.Okçu","Ağır","Şah","Man","Misyoner"];}
							else
								{var unitss=["Mızrak","Kılıç","Balta","Okçu","Casus","Hafif","A.Okçu","Ağır","Şah","Man","Şövalye","Misyoner"];}
	
							var datee=launchTime.toString();
							var dayy=datee.substring(0,3);
							var monthh=datee.substring(4,7);
							var day_num=datee.substring(8,10);
							var year=datee.substring(11,15);
							var days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
							var gunler=["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];							
							var months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
							var aylar=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];					
							for(j=0;j<days.length;j++){
								if (dayy==days[j]){
									var day=gunler[j];
								}
							};							
							for(k=0;k<months.length;k++){
								if (monthh==months[k]){
									var month=aylar[k];
								}
							};							
							var time=datee.substring(16,24);							
							output.push([launchTime.getTime(),unitss[ii]+"("+troop_count+") "+source+" köyünden [u]"+day_num+" "+ month+" "+day+"[/u] [b]"+time+"[/b]",e]);							
						}
					}
				}
			}
		}

		win.$(e).attr("style","display:"+(isVisible?"table-row":"none"));
	});

	/* Sort by Launch Time in Ascending Order */		
	output = output.sort(function(a,b){return (a[0]-b[0]);});
	for(var qq=0;qq<output.length;qq++){win.$("#combined_table").get(0).tBodies[0].appendChild(output[qq][2]);}

	/* Clear existing messages and display version */
	var srcHTML = "";
	srcHTML += "<span style=\"color:red;font-weight:bold\"><center>SALDIRI PLANLAYICISI</center></span>";
	srcHTML += "<span style=\"color:green;font-weight:bold\"><center><sub>Broken Castle & Trafik tarafından düzenlenmiştir</sub></center></span>";
	srcHTML += "<br/>";
	if(output.length > 0){		
		srcHTML += "<div align=\"center\"><textarea wrap=\"off\" readonly=\"yes\" cols=\"80\" rows=\"" + (output.length+4) + "\" style=\"width:75%;background-color:transparent;border:2px solid #765942;border-radius:10px;\" onfocus=\"this.select();\">";
		srcHTML += "[b]Hedef Köy:[/b] "+target+"\n[spoiler=Süreler]\n";
		for(ii=0;ii<output.length;ii++){
			srcHTML += output[ii][1] + "\n";
		}
		srcHTML += "\n[/spoiler]</textarea></div><br/><br/><br/>";
	}
	else{
		srcHTML += "<div align=\"center\"><textarea wrap=\"off\" readonly=\"yes\" cols=\"80\" rows=\"5\" style=\"text-align: center;width:75%;background-color:transparent;border:2px solid #765942;border-radius:10px;\"> \nHiçbir birim istenilen sürede köye yetişemiyor!\n\n Korkusuz Mert Açık (KMA)</textarea></div>";	
		}	
	win.$("#snipe_output").html("");
	win.$("#snipe_output").append(win.$(srcHTML));
}


try{
	if(game_data.screen == 'overview_villages' && game_data.mode == 'combined')
	{
		var author="dalesmckay@gmail.com";
		var minVer="7.0";
		//var win=(window.frames.length>0)?window.main:window;
		var win = window;

		var ver=win.game_data.version.match(/[\d|\.]+/g);
		if(!ver||(parseFloat(ver[1])<0)){
			alert("Bu script en az v"+minVer+" veya daha üstü bir sürüm gerektirir. \nSenin versiyonun: v"+ver[1]);
		}
		else if(win.$("#snipe_output").length <= 0){
			var msPerSec=1000;
			var secsPerMin=60;
			var minsPerHour=60;
			var hrsPerDay=24;
			var msPerMin=msPerSec*secsPerMin;
			var msPerHour=msPerMin*minsPerHour;
			var msPerDay=msPerHour*hrsPerDay;
			var minsPerDay=hrsPerDay*minsPerHour;

			var version='v4.0';

			var unitConfig=fnCreateUnitConfig();

			fnInjectOverviewBar();
		}
	}
	else
	{
		UI.InfoMessage('Kombine Sayfasına Gidiliyor', 3000, 'success');
		window.location = game_data.link_base_pure + 'overview_villages&mode=combined';
	}
}
catch(objError){
	var dbgMsg="Error: " + String(objError.message||objError);
	alert(dbgMsg);
}
