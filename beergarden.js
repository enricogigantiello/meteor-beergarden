Products = new Mongo.Collection("products");
Orders = new Meteor.Collection('orders');
Schedules = new Meteor.Collection("schedules");


Router.configure({ layoutTemplate: 'main'});

Router.route('/order/:_id', {
template: 'listOrder',
data: function(){
  var currentOrder = this.params._id;
  return Orders.findOne({ _id: currentOrder });
   
}
});
Router.route('/mobileOrder/:_id', {
template: 'modifyMobileOrder',
data: function(){
  var currentOrder = this.params._id;
  Session.set('selectedOrder', currentOrder);
  
  return Orders.findOne({ _id: currentOrder });
   
}
});
Router.route('/manageProducts');
Router.route('/manageUsers');
Router.route('/orders');
Router.route('/schedules');
Router.route('/mobileOrders');

Router.route('/', {
name: 'home',
template: 'home'
});



if (Meteor.isClient) {


/*
Functions for login and social login
*/
Accounts.ui.config({
passwordSignupFields: "USERNAME_ONLY"
});

Deps.autorun(function(){
Meteor.subscribe('userData');
Meteor.subscribe('workers');

});


Template.home.helpers({
imageUrl: function() {
 
  return Meteor.user().imageUrl;
}
});

Template.manageUsers.helpers({
users: function () {
   //return Products.find();
  return Meteor.users.find();
},

});

Template.manageUsers.events({
"click .delete": function () {
  var confirm = window.confirm("Delete this product?");
  if(confirm){
	console.log("delete " + this._id)
  
  }
},    
'keyup .form-control': function(){
var user = this._id;
var name = $(event.target).attr('name');
var attr = $(event.target).val();

Meteor.call('updateUser',user,name,attr) 
console.log("update "+name+" "+attr+" "+user);
},
'focusout .select' : function(){
var user = this._id;
var name = $(event.target).attr('name');
var attr = $(event.target).val();
Meteor.call('updateUser',user,name,attr)
console.log("update "+name+" "+attr+" "+user);

}

})

Template.manageProducts.helpers({
products: function () {
   //return Products.find();
  return Products.find({}, {sort: {type: 1, served: 1, name: 1, price: 1}});
}
});

Template.manageProducts.events({
"submit .new-prod": function (event) {
  // Prevent default browser form submit
  event.preventDefault();

  // Get value from form element
  var name = event.target.name.value;
  var price = parseFloat(event.target.price.value);
  var image = event.target.image.value;
  var volume = parseFloat(event.target.volume.value);
  var type = event.target.type.value;
  var description = event.target.description.value;
  var served = event.target.served.value;
  var menu_name = event.target.menu_name.value;
  var sellable = event.target.sellable.checked;

  // Insert a task into the collection
  Products.insert({
	name: name,
	price: price,
	image: image,
	volume: volume,
	type: type,
	served: served,
	menu_name: menu_name,
	description: description,
	finished: false,
	sellable: sellable
	
	//createdAt: new Date() // current time
  });

  // Clear form
  
  event.target.name.value= "";
  event.target.price.value= "";
  event.target.image.value= "";
  event.target.volume.value= "";
  event.target.type.value= "";
  event.target.description.value= "";
  event.target.served.value= "";
  event.target.menu_name.value= "";
  event.target.sellable.checked= false;
}
});

Template.product.helpers({
'isfinished': function(){
	var isFinished = this.finished;
	if(isFinished){
		return "checked";
	} else {
		return "";
	}
},
'issellable': function(){
	var issellable = this.sellable;
	if(issellable){
		return "checked";
	} else {
		return "";
	}
}
});

Template.product.events({
"click .toggle-finished": function () {
  // Set the checked property to the opposite of its current value
  Products.update(this._id, {
	$set: {finished: ! this.finished}
  });
},
"click .toggle-sellable": function () {
  // Set the checked property to the opposite of its current value
  Products.update(this._id, {
	$set: {sellable: ! this.sellable}
  });
},
"click .delete": function () {
  var confirm = window.confirm("Delete this product?");
  if(confirm){
  Products.remove(this._id);
  }
},    
'keyup .form-control': function(){
var documentId = this._id;
var name = $(event.target).attr('name');
var prod_elem = $(event.target).val();
var element={};
element[name]=prod_elem;
Products.update({ _id: documentId }, {$set: element});
}

});

/**
*Orders
*
**/
Template.addOrder.events({
  'submit form': function(event){
	event.preventDefault();
	var guestName = $('[name=guestName]').val();
	var tableNum = $('[name=tableNum]').val();
	
	Orders.insert({
		guestName: guestName,
		tableNum: tableNum,
		createdAt: new Date(),
		bill: 0.0,
		payed: false,
		items: [],
		payedItems: [],
		orderedBy: Meteor.user().username,
		state: "viewed"
	});
	$('[name=guestName]').val('');
	$('[name=tableNum]').val('');
  }
});

Template.orders.helpers({
  'orders': function(){
	return Orders.find({payed : false}, {sort: {guestName: 1}});
  },
  'mod4': function (ind) {
  return ind % 4 === 0
  },
  'grouped_orders': function () {
	all = Orders.find({payed : false}, {sort: {bill: 1}}).fetch();
	chunks = [];
	size = 4;
	while (all.length > size) {
		chunks.push({ row: all.slice(0, size)});
		all = all.slice(size);
	}
	chunks.push({row: all});
	
	return chunks;
  }

});

Template.orders.events({
"click .selectOrder": function () {
  Session.set('selectedOrder', this._id);
  console.log(this._id);

	  
},
"click .pay": function (){
  var selectedOrder = this._id;
  

  var order = Orders.findOne(selectedOrder);
  //var order = Orders.find({_id:"TGmazfgvzHwvBtvBW"}).fetch()
  //alert(order.bill);
  var confirm = window.confirm("Sono "+order.bill+" euri, bello");
  
  if(confirm){
	Meteor.call('payBill',selectedOrder); 
	Router.go('orders');       
  }
}

});

Template.menu.helpers({
 
  'menu_products': function(){
   // var list = Products.find({},{ type: 1, _id: 0 });
	var distinctEntries = _.uniq(Products.find(
								  {}, 
								  {sort: {type: 1}, fields: {type: true}}
								  )
							  .fetch()
							  .map(function(x) 
								{ return x.type;}), true);
	

	var result = [];
	for (var i = 0; i < distinctEntries.length; i++) {
	  res={};
	  res.name = distinctEntries[i];
	  res.products = Products.find({ type: distinctEntries[i], finished: false, sellable: true}, {sort: {type: 1, served: 1, name: 1}});
	  
	  result[i] = res;
	  //result[distinctEntries[i]].name=distinctEntries[i];
	  //result[distinctEntries[i]].products = Products.find({ type: distinctEntries[i], finished: false, sellable: true}, {sort: {type: 1, served: 1, name: 1}});
	}


	

	return result;
	
  },
  'type_list' : function(){
	return Products.find({ finished: false, sellable: true}, {sort: {type: 1, served: 1, name: 1}});

  }

});

Template.menu.events({
"click .add": function () {
  var selectedOrder = Session.get('selectedOrder');
  var product_id = this._id;

  if(selectedOrder != null){
	var cursor = Orders.find({  $and : [  {items: {$elemMatch: {product_id: this._id}}},  {_id: selectedOrder }  ]});
	//looks for orders with selectedOrder = id that has product_id in the items array
	//in other words if the order has already that product
	
	if(cursor.count()>0){
	  Meteor.call('addQuantity',selectedOrder, product_id, this.price);
   }else{

	  var item = {
	  product_id:  this._id,
	  name: this.name,
	  volume: this.volume,
	  price:  this.price,
	  image:  this.image, 
	  quantity: 1,
	  menu_name: this.menu_name,
	  sub_total: this.price
	  };
	
	  
	  Orders.update(selectedOrder, {
		$push: { items: item },
		$inc: { bill: parseFloat(item.price) }
	  
	  });

	}
	
	//if (addOrder){alert(addOrder.count());}

	

  }
  else {
	var confirm = window.confirm("didn't choose an order");
  
  if(confirm){
	//Meteor.call('payBill',selectedOrder);
	Router.go('orders');
	
  }
	//alert("didn't choose an order");
	

  }
  
}

});

Template.listItem.events({
"click .delete": function (event, template){
  var selectedOrder = $(event.target).closest('div .panel-body').attr('id');  
  var prod_id= this.product_id;
  var quantity = parseInt(this.quantity);
  var confirm = window.confirm("Delete one "+this.name+" from this order ?");

  if(confirm){
	if (quantity > 1){
	  Meteor.call('remQuantity',selectedOrder, prod_id, this.price);

	}else{

	  Meteor.call('remItem',selectedOrder, prod_id, this.price);
	}
  }
},
"click .pay": function payBill(){
  
 
  var selectedOrder = Session.get('selectedOrder');

  var order = Orders.findOne(selectedOrder);
  //var order = Orders.find({_id:"TGmazfgvzHwvBtvBW"}).fetch()
  //alert(order.bill);
  var confirm = window.confirm("Sono "+order.bill+" euri, bello");
  
  if(confirm){
	Meteor.call('payBill',selectedOrder);
	Router.go('orders');
	
  }
},
"click .payItem": function  (event, template){
   var selectedOrder = $(event.target).closest('div .panel-body').attr('id');

 
  var num = Orders.findOne( selectedOrder).items.length;

  
  

  var item = {
	  product_id:  this.product_id,
	  name: this.name,
	  menu_name: this.menu_name,
	  price:  this.price,
	  image:  this.image, 
	  quantity: 1
	  };
  //var quantity = parseInt(this.quantity);
  
  var confirm = window.confirm("Sono "+parseFloat(this.price)+" euri, bello");
  if(confirm){
	

	Meteor.call('payItem',selectedOrder, item);
	if (this.quantity > 1){
	  Meteor.call('remQuantity',selectedOrder, this.product_id, this.price);

	}else{
	  Meteor.call('remItem',selectedOrder, this.product_id, this.price);
	  
	}

	 
  if (num == 1){
		
		Orders.update(selectedOrder,{ $set: {payed:true}});
		Router.go('orders');
	  }


  }
},
"click .lowerPrice": function (){
  Meteor.call('modifyPrice',
			  Session.get('selectedOrder'),
			  this.product_id,
			  -1);
  
},
"click .raisePrice": function (){
  Meteor.call('modifyPrice',
			  Session.get('selectedOrder'),
			  this.product_id,
			  1);

},

});

Template.orderItem.events({
'click .editOrder' : function(event){

  var order = $(event.target).attr('name');

  
  var selector = "#"+order+" .edit";
	console.log(selector);
  $(selector).fadeToggle();
},

 "click .deleteOrder": function (){
  var confirm = window.confirm("Delete the order: "+this.guestName +" Tab: "+this.tableNum+" ?");
  if(confirm){
	var selectedOrder = this._id;
  
	  
	Meteor.call('remOrder',selectedOrder);
  }
},
'keyup .form-control': function(){
var order = this._id;
var name = $(event.target).attr('name');
var attr = $(event.target).val();

Meteor.call('updateOrder',order,name,attr) 
console.log("update "+name+" "+attr+" "+order);
}
/*'focusout .focus' : function(){
   console.log("lost");
$(".edit").hide();
}*/
})

Template.schedules.helpers({
'dates' : function(){
  var week = getCurrentWeek(new Date());
  var weekSchedule = [];
  

  for (var i = 0; i < week.length; i++) {
	//var date = ""+week[i].getWeekDay()+", "+week[i].getDay()+"/"+week[i].getMonth()+"/"+week[i].getFullYear();
	if(Schedules.find({date : week[i] }).fetch().length != 0){

	  

		  
	  weekSchedule.push(Schedules.find({date : week[i] }).fetch()[0]);
	}
   
  }
  if (weekSchedule.length==0){weekSchedule = false;}
  console.log(weekSchedule);

  return weekSchedule;

},
'workers' : function(){ 
  return Meteor.users.find({role : "worker"});
  //Meteor.call('getWorkers');
}
});

Template.schedules.events({
'click .add' : function(){
   Session.set('selectedDay', this._id);  
},
'click .generate' : function(){
  var week = getCurrentWeek(new Date());
  var weekSchedule = [];
  for (var i = 0; i < week.length; i++) {
	 if(Schedules.find({date : week[i] }).fetch().length == 0){
	  
	  var daySchedule = {
		//dateObj: date,
		date: week[i],
		cash: [],
		bar: [],
		waiters: [],
		door: [],
		kitchen: []
	  }
	  Schedules.insert(daySchedule);
 
	}
  }  
  Router.go('schedules'); 

}


});

Template.insertUserModal.helpers({

'workers' : function(){

  return Meteor.users.find();
}


});

Template.insertUserModal.events({
"submit #addWorker": function (event) {
 // Prevent default browser form submit
 event.preventDefault();

 // Get value from form element
 var role = event.target.role.value;
  var worker_id = event.target.username.value;
  var day = Session.get('selectedDay');
  
  var worker = Meteor.users.findOne(worker_id);
  var worker_data = {
	_id: worker_id,
	username: worker.username,
	imageUrl: worker.imageUrl,
	day_id: day
  }

  var element = {};
  element[role]=worker_data;
  Schedules.update(day, {$push: element});

}
});

Template.displayDate.events({
//removes a worker from a schedule
"click .delete": function(event){
  var role = $(event.target).attr('name');
  var person = this._id;
  var day = this.day_id;
  var element = {};
  element[role]= { _id: person}
  Schedules.update(day,{ $pull:element });
  
  console.log(this._id+" " +this.day_id);

}

})

Template.mobileOrders.events({
  'submit form': function(event){
	event.preventDefault();
	var guestName = $('[name=guestName]').val();
	var tableNum = $('[name=tableNum]').val();
	
	Orders.insert({
		guestName: guestName,
		tableNum: tableNum,
		createdAt: new Date(),
		bill: 0.0,
		payed: false,
		items: [],
		payedItems: [],
		orderedBy: Meteor.user().username,
		state: "new"
	});
	$('[name=guestName]').val('');
	$('[name=tableNum]').val('');
  }
});

Template.mobileOrders.helpers({
	'orders': function(){
	return Orders.find({payed : false}, {sort: {createdAt: 1}});
  },
	
});

Template.modifyMobileOrder.helpers({
	'idord': function(){
	return Session.get("selectedOrder");
  },
	
});

Template.listItemMobile.events({
  "click .delete": function (event, template){
  var selectedOrder = Session.get("selectedOrder");  
  var prod_id= this.product_id;
  var quantity = parseInt(this.quantity);
  var confirm = window.confirm("Delete one "+this.name+" from this order ?");

  if(confirm){
	if (quantity > 1){
	  Meteor.call('remQuantity',selectedOrder, prod_id, this.price);

	}else{

	  Meteor.call('remItem',selectedOrder, prod_id, this.price);
	}
  }
},
});

Template.menuMobile.helpers({
 
  'menu_products': function(){
   // var list = Products.find({},{ type: 1, _id: 0 });
	var distinctEntries = _.uniq(Products.find(
								  {}, 
								  {sort: {type: 1}, fields: {type: true}}
								  )
							  .fetch()
							  .map(function(x) 
								{ return x.type;}), true);
	

	var result = [];
	for (var i = 0; i < distinctEntries.length; i++) {
	  res={};
	  res.name = distinctEntries[i];
	  res.products = Products.find({ type: distinctEntries[i], finished: false, sellable: true}, {sort: {type: 1, served: 1, name: 1}});
	  
	  result[i] = res;
	  //result[distinctEntries[i]].name=distinctEntries[i];
	  //result[distinctEntries[i]].products = Products.find({ type: distinctEntries[i], finished: false, sellable: true}, {sort: {type: 1, served: 1, name: 1}});
	}


	

	return result;
	
  },
  'type_list' : function(){
	return Products.find({ finished: false, sellable: true}, {sort: {type: 1, served: 1, name: 1}});

  }

});
}

if(Meteor.isServer){

Accounts.onCreateUser(function(options, user) { 
user.role = "user";
if(user.services.hasOwnProperty("facebook")){
  user.imageUrl = "http://graph.facebook.com/"+user.services.facebook.id+"/picture/?type=large";
  user.username = user.services.facebook.name;
} else {
  user.imageUrl = "/images/default-user.png";
}
return user;
});

Meteor.publish('userData', function() {
  if(!this.userId) return null;
  return Meteor.users.find(this.userId, {fields: {
	role: 1, imageUrl: 1,
  }});
});

Meteor.publish('workers', function() {

  return Meteor.users.find({role: "worker"});
});

Meteor.methods({

'addQuantity': function(selectedOrder, product_id, price){
 

  Orders.update(selectedOrder, {
		$inc: { bill: parseFloat( price) }
	  
	  });

 
  Orders.update(
	{ _id: selectedOrder , "items.product_id": product_id },
	{ 
	  $inc: { "items.$.quantity" : 1 }
	}
  )

  Orders.update(
	{ _id: selectedOrder , "items.product_id": product_id },
	{ 
	  $inc: { "items.$.sub_total" : parseFloat(price) }
	}
  )        
},

'remQuantity': function(selectedOrder, product_id,price){
 

  Orders.update(selectedOrder, {
		$inc: { bill: -parseFloat( price) }
	  
	  });

 
  Orders.update(
	{ _id: selectedOrder , "items.product_id": product_id },
	{ $inc: { "items.$.quantity" : -1 } }
  )  
  
  Orders.update(
	{ _id: selectedOrder , "items.product_id": product_id },
	{ $inc: { "items.$.sub_total" : -parseFloat(price) }
	 }
  )
},

'remItem': function(selectedOrder, product_id,price){

  Orders.update(selectedOrder,{ $pull: { items: { product_id: product_id } } },{ multi: false });
  Orders.update(selectedOrder,{$inc: { bill: -(price) }},{ multi: false });    
},

'payBill': function(selectedOrder){
  Orders.update(selectedOrder,{ $set: {payed:true}});

  var items = Orders.findOne( selectedOrder).items;

  for (var i = items.length - 1; i >= 0; i--) {
	var item = {
	  product_id:  items[i].product_id,
	  name: items[i].name,
	  menu_name: items[i].menu_name,
	  price:  items[i].sub_total, 
	  quantity: items[i].quantity
	  };

	Orders.update(selectedOrder,{ 
	  $pull: { items: { product_id: items[i].product_id } } 
		},{ multi: false });

	Orders.update(selectedOrder, {
		$push: { payedItems: item },
	  }); 
  };

		
},

'payItem': function(selectedOrder, item){
 
  Orders.update(selectedOrder, {
		$push: { payedItems: item },
		//$inc: { bill: parseFloat(item.price) }
	  });        
},

'modifyPrice': function(selectedOrder, product_id, mod){
  Orders.update(
   { _id: selectedOrder , "items.product_id": product_id },
   { $inc: { "items.$.sub_total" : mod }
	}
   );

  Orders.update(selectedOrder,{$inc: { bill: mod }},{ multi: false });
			 
},

'remOrder': function(selectedOrder){
  /*
   Orders.remove(
	{ _id: selectedOrder },
	{ }

  );*/
			 
},

'addWorker': function(day, worker_id, role){
  var worker = Meteor.users.findOne(worker_id);
  var worker_data = {
	_id: worker_id,
	username: worker.username,
	imageUrl: worker.imageUrl
  }
  var element = {};
  element[role]=worker_data;
  Schedules.update(day, {$push: element});

  
},

'updateUser': function(user, name, attr){
  var element={};
element[name]=attr;
//Products.update({ _id: documentId }, {$set: element});

Meteor.users.update(user, {$set: element});


  
},

'updateOrder': function(order, name, attr){
  var element={};
element[name]=attr;
//Products.update({ _id: documentId }, {$set: element});

Orders.update(order, {$set: element});


  
}




});


// uncomment to have rest services
// server code goes here
// Global API configuration
var Api = new Restivus({
useDefaultAuth: true,
prettyJson: true
});

// Generates: GET, POST on /api/coll and GET, PUT, DELETE on
// /api/coll/:id for Items collection
Api.addCollection(Products);
Api.addCollection(Orders);



}


Date.prototype.addDays = function(days) {
var dat = new Date(this.valueOf())
dat.setDate(dat.getDate() + days);
return dat;
}

Date.prototype.getWeekDay = function() {
var day ="";
if(this.getDay() == 0) {day = "Dom";}
else if (this.getDay() == 1) {day = "Lun";}
else if (this.getDay() == 2) {day = "Mar";}
else if (this.getDay() == 3) {day = "Mer";}
else if (this.getDay() == 4) {day = "Gio";}
else if (this.getDay() == 5) {day = "Ven";}
else if (this.getDay() == 6) {day = "Sab";}
return day;
}

Date.prototype.getMonthName = function () {
var month = new Array();
month[0] = "January";
month[1] = "February";
month[2] = "March";
month[3] = "April";
month[4] = "May";
month[5] = "June";
month[6] = "July";
month[7] = "August";
month[8] = "September";
month[9] = "October";
month[10] = "November";
month[11] = "December";
return month[this.getMonth()];

}

function getCurrentWeek(d) {
d = new Date(d);
var day = d.getDay(),
  diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
  var monday = new Date(d.setDate(diff));
  var dateArray = new Array();
  for (var i = 0; i <7 ; i++) {
	dateArray.push( new Date (monday.addDays(i).setHours(0,0,0,0)) );

	
  };
return dateArray;
}



// Mon Nov 08 2010
