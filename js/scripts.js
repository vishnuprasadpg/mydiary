document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {

	mydiaryapp.init();

}

var month=["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var db = openDatabase('mydiary', '1.0', 'mydiary local database', 5 * 1024 * 1024);
	db.transaction(function (tx) {
	  tx.executeSql('CREATE TABLE IF NOT EXISTS diary (id integer primary key autoincrement, daycaption TEXT, daydescription TEXT, photo TEXT, createddate TEXT, storedin TEXT)');
	});

var loading = {
		show: function(){
			$(".ui-loader").show();
		},
		hide: function(){
			$(".ui-loader").hide();
		}
};


var mydiaryapp = {
	diarycontainer : $("#diary-content"),
	writeindiarybutton : $("a#writeindiary"),
	// addphotobutton : $("a#addphoto"),
	userid : 1,
	init : function() {
		diarycontainer = this.diarycontainer;
		
		if(navigator.onLine){
			this.writeindiarybutton.click(this.writeindiary);
			 this.getdiarydatafromserver(this.userid);
		}else{
			this.writeindiarybutton.click(this.writeindiaryoffline);
			this.getdiaryofflinedata();
		}

	},
	writeindiary: function() {
		
		if($("input[name=daycaption]").val() != "" && $("input[name=daydescription]").val() != "" ){
			loading.show();
			$.ajax({
				url  : "http://mobileapps-vishnuasalta.rhcloud.com/mydiary/wirtetodiary/?"+$("form#diaryform").serialize(),
				dataType : "json",
				success : function(resp){
	
					if(!resp.error){
						$("form#diaryform").trigger("reset");
				        	
				        var diarydate = new Date(resp.createddate.date);
				        var gethour = diarydate.getHours();
						
						if (gethour < 12) {
							a_p = "AM";
						} else {
							a_p = "PM";
						}
						if (gethour == 0) {
							gethour = 12;
						}
						if (gethour > 12) {
							gethour = gethour - 12;
						}
		
		
						var record = $("<div/>")
										.addClass("row-fluid diaryentry")
										.html(  '<span class="d-date span3"><span class="d-day">'
											  + diarydate.getDate() + '</span><br /><span class="d-month">'
											  + month[diarydate.getMonth()] + ' '
											  + diarydate.getFullYear() + '</span></span>'
											  + '<span class="d-notes span9 arrow_box"><span class="d-caption">'
											  + resp.daycaption + '<span class="d-time">'
											  + gethour + ':' + diarydate.getMinutes() + ' ' + a_p +'</span></span><br /><span class="d-desc">'
											  + resp.daydescription + '</span></span>');
						diarycontainer.prepend(record);
						
				        navigator.notification.alert(
				        	'Done...',  // message
				            alertDismissed,         // callback
				            'Done',            // title
				            'Done'                  // buttonName
				        );
						
					}else{
				        navigator.notification.alert(
				        	'Error - '+resp.error,  // message
				            alertDismissed,         // callback
				            'Done',            // title
				            'Done'                  // buttonName
				        );					
					}
				},
				error: function (j, st, e) {
				  console.log(e);
				}
			});
			loading.hide();
		}
		
	},
	getdiarydatafromserver : function(id) {
		loading.show();
		diarycontainer = this.diarycontainer;

		this.pushlocaltoserver();
		this.clearserverdatainlocal();

		$.ajax({
			url : "http://mobileapps-vishnuasalta.rhcloud.com/mydiary/getmydiary/" + id + "/",
			dataType : "json"
		}).done(function(data) {
			//console.log(data.id);
			diarycontainer.html("");
			
			
			$.each(data, function(key, value) {
				var diarydate = new Date(value.createddate.date);
				var gethour = diarydate.getHours();
				
				if (gethour < 12) {
					a_p = "AM";
				} else {
					a_p = "PM";
				}
				if (gethour == 0) {
					gethour = 12;
				}
				if (gethour > 12) {
					gethour = gethour - 12;
				}

				var records = $("<div/>")
								.addClass("row-fluid diaryentry")
								.html(  '<span class="d-date span3"><span class="d-day">'
									  + diarydate.getDate() + '</span><br /><span class="d-month">'
									  + month[diarydate.getMonth()] + ' '
									  + diarydate.getFullYear() + '</span></span>'
									  + '<span class="d-notes span9 arrow_box"><span class="d-caption">'
									  + value.daycaption + '<span class="d-time">'
									  + gethour + ':' + diarydate.getMinutes() + ' ' + a_p + '</span></span><br /><span class="d-desc">'
									  + value.daydescription + '</span></span>');
				diarycontainer.append(records);
				
				db.transaction(function (tx) {
				  tx.executeSql('INSERT INTO diary (daycaption, daydescription, photo, createddate, storedin) VALUES ("'+value.daycaption+'", "'+value.daydescription+'", "", "'+value.createddate.date+'", "server")');
				});				
			});
		});
		loading.hide();
	},
	clearserverdatainlocal: function () {
		db.transaction(function (tx) {
		  tx.executeSql('DELETE FROM diary WHERE storedin = "server" OR storedin = "local"');
		});			  
	},
	pushlocaltoserver:function () {
		
		userid = this.userid;
		db.transaction(function (tx) {
		   
		   tx.executeSql('SELECT * from diary WHERE storedin = "local"', [], function(tx, results) {
		   	
		      var len=results.rows.length;
		      var i;
		      for(i=0; i<len; i++) {
		      	
		      	var localdata = "daycaption="+results.rows.item(i).daycaption+"&daydescription="+results.rows.item(i).daydescription+"&userid="+userid+"&createddate="+results.rows.item(i).createddate;
		      	
		      	// console.log(localdata);
				$.ajax({
					url  : "http://mobileapps-vishnuasalta.rhcloud.com/mydiary/wirtetodiary/?"+localdata,
					dataType : "json",
					success : function(resp){
				//		console.log(resp);
					},
					error: function (j, st, e) {
					  console.log(e);
					}
				});		      	
		      	
		      }
   
		    });
		   
		});	
		
		return;  
	},
	writeindiaryoffline: function () {
		if($("input[name=daycaption]").val() != "" && $("input[name=daydescription]").val() != "" ){
		
		  	loading.show();
			var formdata = $("form#diaryform").serializeArray();
	        var diarydate = new Date();
	        
			// console.log(formdata[0].value);
			// exit;
			
			db.transaction(function (tx) {
			  tx.executeSql('INSERT INTO diary (daycaption, daydescription, photo, createddate, storedin) VALUES ("'+formdata[0].value+'", "'+formdata[1].value+'", "", "'+diarydate+'", "local")');
			});
			        	
	        var gethour = diarydate.getHours();
			
			if (gethour < 12) {
				a_p = "AM";
			} else {
				a_p = "PM";
			}
			if (gethour == 0) {
				gethour = 12;
			}
			if (gethour > 12) {
				gethour = gethour - 12;
			}
	
	
	
			var record = $("<div/>")
							.addClass("row-fluid diaryentry")
							.html(  '<span class="d-date span3"><span class="d-day">'
								  + diarydate.getDate() + '</span><br /><span class="d-month">'
								  + month[diarydate.getMonth()] + ' '
								  + diarydate.getFullYear() + '</span></span>'
								  + '<span class="d-notes span9 arrow_box"><span class="d-caption">'
								  + formdata[0].value + '<span class="d-time">'
								  + gethour + ':' + diarydate.getMinutes() + ' ' + a_p +'</span></span><br /><span class="d-desc">'
								  + formdata[1].value + '</span></span>');
			diarycontainer.prepend(record);
			$("form#diaryform").trigger("reset");
	        navigator.notification.alert(
	        	'Done...',  // message
	            alertDismissed,         // callback
	            'Done',            // title
	            'Done'                  // buttonName
	        );
			loading.hide();		
		}
	},
	getdiaryofflinedata : function() {
		loading.show();

		diarycontainer = this.diarycontainer;
				
		diarycontainer.html("");

		db.transaction(function (tx) {
		   
		   tx.executeSql('SELECT * from diary ORDER BY storedin ASC', [], function(tx, results) {
		      var len=results.rows.length;
		      var i;
		      for(i=0; i<len; i++) {
		      
				var diarydate = new Date(results.rows.item(i).createddate);
				var gethour = diarydate.getHours();
				
				if (gethour < 12) {
					a_p = "AM";
				} else {
					a_p = "PM";
				}
				if (gethour == 0) {
					gethour = 12;
				}
				if (gethour > 12) {
					gethour = gethour - 12;
				}
	
				var records = $("<div/>")
								.addClass("row-fluid diaryentry")
								.html(  '<span class="d-date span3"><span class="d-day">'
									  + diarydate.getDate() + '</span><br /><span class="d-month">'
									  + month[diarydate.getMonth()] + ' '
									  + diarydate.getFullYear() + '</span></span>'
									  + '<span class="d-notes span9 arrow_box"><span class="d-caption">'
									  + results.rows.item(i).daycaption + '<span class="d-time">'
									  + gethour + ':' + diarydate.getMinutes() + ' ' + a_p + '</span></span><br /><span class="d-desc">'
									  + results.rows.item(i).daydescription + '</span></span>');
				diarycontainer.append(records);		      
		      }
   
		    });
		   
		});
		loading.hide();
	}
}
function alertDismissed(){
	//nothing
}
