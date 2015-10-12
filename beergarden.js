Products = new Mongo.Collection("products");
Orders = new Meteor.Collection('orders');
Schedules = new Meteor.Collection("schedules");
Categories = new Meteor.Collection("categories");
Prods = new Meteor.Collection("prods");


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
Router.route('/manageCategoryProducts');
Router.route('/manageProducts');
Router.route('/manageUsers');
Router.route('/manageCategories');
Router.route('/categoryOrders');
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


Template.manageCategoryProducts.helpers({
	categories: function() {
		return Categories.find();
	},
	prods: function() {
		return Prods.find({type: this._id});
	},
	fieldvalue: function(){
		return Template.parentData(1)[this];
	},
	checkedCategory: function(){
		if(Template.parentData(1)["ingredients"].indexOf(this._id) > -1){
			return "checked";
		}
	},
	checkedIngredient: function(){
		if(Template.parentData(1)["fixedIngredients"].indexOf(this._id) > -1){
			return "checked";
		}
	},
	isfinished: function(){
		if(this.finished){
			return "checked";
		}
	},
	notIngredient: function(){
		return this!="ingredients";
	},
	selectedCategoriesProducts: function(){
		
		return Prods.find({type:{$in:this.ingredients}});
	}
	
});

Template.manageCategoryProducts.events({
	"change #selectCat": function(evt) {
		var catId = $(evt.target).val();
		//console.log(newValue);
		var category = Categories.findOne(catId);
		var fixedContainer= $("#fixed_fields");
		var customContainer= $("#custom_fields");
		var ingredientsContainer= $("#ingredients_field");	
		fixedContainer.empty();
		customContainer.empty();
		ingredientsContainer.empty();

		$(fixedContainer).append('<div><input type="text"  name="name"	 placeholder="name" /></div>');
		
		if(category.sellable){
			for (var i = 0; i < category.menu_fields.length;i++){
				if(category.menu_fields[i] != "ingredients"){
					$(fixedContainer).append('<div><input type="text"  name="'+category.menu_fields[i]+'"	 placeholder="'+category.menu_fields[i]+'" /></div>');
					console.log(category.menu_fields[i])
				} else {
					var ingredients_html='<div class="well" id="ingredients"><h4>Scegli le categorie da mostrare nel sottomenu di questo prodotto</h4>';
					var catArray= Categories.find().fetch();
					for(var j=0; j< catArray.length; j++){
						ingredients_html+='<label class="checkbox-inline"><input type="checkbox" value="'+catArray[j]._id+'">'+catArray[j].name+'</label>';
					}
					//console.log(catArray);
					ingredients_html+='</div>'; 
					$(ingredientsContainer).append(ingredients_html);
				}
				
			}
		}
		
		for (var i = 0; i < category.fields.length; i++){
			$(customContainer).append('<div><input type="text"  name="'+category.fields[i]+'"	 placeholder="'+category.fields[i]+'" /></div>');
			console.log(category.fields[i]);	
		}
	},
	"submit #add_category_product": function(evt) {
		 evt.preventDefault();
		  var element={};
		 $("#add_category_product input[type=text]").each(function(){
			var name= $(this).attr("name");
			var val= $(this).val();
			element[name]=val;
		});
		
		var selected = [];
		$('#ingredients input:checked').each(function() {
			console.log($(this).val());
			selected.push($(this).val());
		});
		element["ingredients"]= selected;
		element["fixedIngredients"]=[];
		element["type"] = $("#selectCat").val();
		element["finished"] = false;
		console.log(element);
		Prods.insert(element);
	},
	'keyup .editableField': function(){
	var prodId = $(event.target).attr('prodid');
	var name = $(event.target).attr('name');
	
	var prod_elem = $(event.target).val();
	
	var element={};
	element[name]=prod_elem;
	Prods.update({ _id: prodId }, {$set: element});
	},
	"click .toggle-finished": function () {
	// Set the checked property to the opposite of its current value
	Prods.update(this._id, {
	$set: {finished: ! this.finished}
	});
	},
	"click .deleteProduct": function () {
	var confirm = window.confirm("Delete product "+this.name+"?");
	if(confirm){
	  Prods.remove(this._id);
	}
	},
	"click .addCategoryToIngredients" : function(){
	var checked= $(event.target).is(':checked');
	var category_id= this._id;
	var prod_id= $(event.target).attr("prodid");
	
	console.log(checked);
	console.log(prod_id);
	console.log(category_id);
	
	if(checked) {
	 
		Prods.update(prod_id, {
		$push: { ingredients: category_id }}); 
	} else {
		
		Prods.update(prod_id, {
		$pull: { ingredients: category_id }}); ;
		}
	//Meteor.call("updateCheckedIngredients",prod_id,ingredient_id,checked);
	
	},
	"click .addFixedIngredient" : function(){
	var checked= $(event.target).is(':checked');
	var prod_id= this._id;
	var parent_prod_id= $(event.target).attr("prodid");
	
	console.log(checked);
	console.log(prod_id);
	console.log(parent_prod_id);
	
	if(checked) {
	 
		Prods.update(parent_prod_id, {
		$push: { fixedIngredients: prod_id }}); 
	} else {
		
		Prods.update(parent_prod_id, {
		$pull: { fixedIngredients: prod_id }}); ;
		}
	
	}
});

/*Template.manageCategoryProducts.rendered = function() {
    if(!this._rendered) {
      this._rendered = true;
	  var cat = $("#selectCat option:selected").val();
      console.log(cat);
      console.log('Template onLoad');
    }
}
*/

Template.manageCategories.events({
"click .add_new_field": function (e) {
	e.preventDefault();
	var wrapper			= $("#new_fields_container"); //Fields wrapper
	$(wrapper).append('<div><input type="text" class="form-control" name="mytext[]"	 placeholder="insertfieldname" /><a href="#" class="remove_field">Remove</a></div>'); //add input box
  
  },
  
  "click .remove_field": function (e) {
	e.preventDefault();
	//console.log($(this));
	$(event.target).parent('div').remove();
  },
  "click .update_remove_field": function (e) {
	e.preventDefault();
	var name = $(event.target).attr('name');
	var selectedCat = $(event.target).attr('category');
	//var attr = $(event.target).val();
	console.log(selectedCat);
	var element = {};
	element["fields"]= name;
	Categories.update(	selectedCat ,	{ $pull: element }	);
	},
   "click .add_field": function (e) {
	e.preventDefault();
	var name = $(event.target).prev().val();
	var selectedCat = this._id;
	//var attr = $(event.target).val();
	console.log(selectedCat);
	var element = {};
	element["fields"]= name;
	
	
	Categories.update(selectedCat ,{ $push: element });
	$(event.target).prev().val("");
  },
   "click .remove_cat": function (e) {
	e.preventDefault();
	var confirm = window.confirm("Delete this category?");
	if(confirm){
		Meteor.call("removeCategory",this._id);
	}
  },
  "submit #new-cat": function (e){
	  e.preventDefault();
	/**
	*le categorie hanno sempre nome e sellable
	*se sellable è true vengono aggiunti automaticamente i campi obbligatori alla rappresentazione sul menu
	*ogni prodotto avrà anche il campo finished per la gestione del magazzino
	*
	*
	*
	**/
	var fields = [];
	var name = event.target.name.value;
	var sellable = event.target.sellable.checked;
	$("#new-cat input[type=text]").each(function(){
	if($(this).attr('name') != "name" && $(this).val() != "" ){
		fields.push($(this).val()); 
	}
	
	});
	
	if (sellable){
	var menu_fields = ["menu_name","price","image","description","ingredients"];
	var category = {
		name: name,
		sellable: sellable,
		fields: fields,
		menu_fields: menu_fields,
		createdAt: new Date()
		}	
	} else {
		var category = {
		name: name,
		sellable: sellable,
		fields: fields,
		createdAt: new Date()
		}		
	}
	Categories.insert(category);
	
	$("#new_cat_name").val("");
	$("#new_fields_container").empty();
  },
  "click .toggle-sellable": function () {
  // Set the checked property to the opposite of its current value
  var menu_fields = [];
  if($(event.target).is(':checked')){
	  menu_fields = ["menu_name","price","image","description","ingredients"];	
  }
  
  Categories.update(this._id, {
	$set: {sellable: ! this.sellable, menu_fields:menu_fields}
  });
  
}
 
});

Template.manageCategories.helpers({
	categories: function() {
		return Categories.find();
	},
	'issellable': function(){
	var issellable = this.sellable;
	if(issellable){
		return "checked";
	} else {
		return "";
	}
	}
})

Template.categoryMenu.helpers({
 
  'sellable_categories': function(){
  
	return Categories.find({sellable:true});
	
  },
  'products' : function(){
	  var catId= Template.parentData(0)._id;
	return Prods.find({ finished: false, type: catId}, {sort: {name: 1}});

  },
  'firstCategory':function(){
	  var firstCatId = Categories.find({sellable:true}).fetch()[0]._id;
	  
	  if(firstCatId==this._id){
		  return "active";
	  }
  }

});

Template.categoryMenu.events({
"click .addVariation": function(){
	var prodName=$(event.target).attr("name"); 
	var prodId = $(event.target).val();
	if($(event.target).is(':checked')){
		$("#variedProduct").append("<p style ='display: inline-block;' prod="+prodId+"> +"+prodName+"</p>");	
	} else {
		$('p[prod='+prodId+']').remove();
		//$( "p[prod="+prod+"]" ).remove();
		
	}
	
},
"click .add": function () {
	$('#variations').empty();
	$('#variedProduct').empty();
  
  //var ordId= Template.parentData(0)._id;
  
  var product_id = this._id;
  //console.log(this.ingredients.length);
  if(this.ingredients.length > 0){
	  $('#variations').append('<h3>Variazioni:</h3>');
	  for(var i = 0; i< this.ingredients.length;i++){
		  var name= Categories.findOne(this.ingredients[i],{fields: {'name':1}}).name;
		  var prods = Prods.find({type: this.ingredients[i]},{fields: {'name':1}} ).fetch();
		  console.log(name);
		  var htmlstring="<div class='well'><h4>"+name+":</h4>";
		  for(var j=0; j< prods.length;j++){
			  var checked="";
			  if($.inArray(prods[j]._id,this.fixedIngredients)>=0){
				  checked="checked"
			  }
			  htmlstring+='<label class="checkbox-inline"><input type="checkbox" class="addVariation" value="'+prods[j]._id+'" name="'+prods[j].name+'" '+checked+'>'+prods[j].name+'</label>';
		  }
		  htmlstring+="</div>"
		  $('#variations').append(htmlstring);
		  
	  }
	  
	  for(var k = 0; k< this.fixedIngredients.length; k++){
		var fixedProd = Prods.findOne(this.fixedIngredients[k],{fields: {'name':1}} );
		$("#variedProduct").append("<p style ='display: inline-block;' prod="+fixedProd._id+"> +"+fixedProd.name+"</p>");
		
	  }
	  $('#variations').prepend('<br><button type="button" class="btn btn-info addComposedProduct" prodId="'+this._id+'">Aggiungi</button>');
	  
	return; 
  }

  var selectedOrder = Session.get('selectedOrder');
  if(selectedOrder != null){
	var cursor = Orders.find({	$and : [  {items: {$elemMatch: {product_id: this._id}}},  {_id: selectedOrder }	 ]});
	//looks for orders with selectedOrder = id that has product_id in the items array
	//in other words if the order has already that product
	
	if(cursor.count()>0){
	  Meteor.call('addQuantity',selectedOrder, product_id, this.price);
   }else{

	  var item = {
	  product_id:  this._id,
	  name: this.name,
	  volume: this.volume,
	  price:  parseFloat(this.price),
	  image:  this.image, 
	  quantity: 1,
	  menu_name: this.menu_name,
	  sub_total: parseFloat(this.price)
	  };
	
	  
	  Orders.update(selectedOrder, {
		$push: { items: item },
		$inc: { bill: parseFloat(item.price) }
	  
	  });

	}

  }
  else {
	var confirm = window.confirm("didn't choose an order");
  
  if(confirm){
	Router.go('categoryOrders');	
  }

  }
  
},
"click .addComposedProduct": function(){
	var selectedOrder = Session.get('selectedOrder');
	console.log("selord"+selectedOrder);
	var prodId=$(event.target).attr("prodId");
	console.log(prodId);
	var product = Prods.findOne(prodId);
	product.menu_name+=$( "div #variedProduct" ).text();
	if(selectedOrder != null){
		var item = {
		  product_id:  product._id,
		  name: product.name,
		  volume: product.volume,
		  price:  parseFloat(product.price),
		  image:  product.image, 
		  quantity: 1,
		  menu_name: product.menu_name,
		  sub_total: parseFloat(product.price)
		  };
		
		  
		  Orders.update(selectedOrder, {
			$push: { items: item },
			$inc: { bill: parseFloat(item.price) }
		  
		  });

	

	}else {
	var confirm = window.confirm("didn't choose an order");
		if(confirm){	
		Router.go('categoryOrders');		
		}
	}
}
});

Template.addCategoryOrder.events({
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

Template.categoryOrders.helpers({
  'orders': function(){
	return Orders.find({payed : false}, {sort: {guestName: 1}});
  },
  'mod4': function (ind) {
  return ind % 4 === 0
  },
  'grouped_orders': function () {
	all = Orders.find({payed : false}, {sort: {createdAt: -1}}).fetch();
	chunks = [];
	size = 3;
	while (all.length > size) {
		chunks.push({ row: all.slice(0, size)});
		all = all.slice(size);
	}
	chunks.push({row: all});
	
	return chunks;
  }

});

Template.categoryOrders.events({
"click .selectOrder": function () {
  Session.set('selectedOrder', this._id);
  //console.log(this._id);

	  
},

});

Template.categoryOrderItem.helpers({
	"minutesAgo": function(){
		
		var today = new Date();
	
		var diffMs = (today - this.createdAt); // milliseconds between now & Christmas
		var diffDays = Math.round(diffMs / 86400000); // days
		var diffHrs = Math.round((diffMs % 86400000) / 3600000); // hours
		var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // 
		var result= "Creato ";
		if(diffDays>0){
			result+=diffDays+"g ";
		}
		if(diffHrs>0){
			result+=diffHrs+"h ";
		}
		if(diffMins>=0){
			result+=diffMins+"m ";
		}
		
		result+="fa";
		
		
		return result;
	}
})

Template.categoryOrderItem.events({
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
	console.log(selectedOrder);
  
	  
	Meteor.call('remOrder',selectedOrder);
  }
},
'keyup .form-control': function(){
var order = this._id;
var name = $(event.target).attr('name');
var attr = $(event.target).val();

Meteor.call('updateOrder',order,name,attr) 
console.log("update "+name+" "+attr+" "+order);
},
/*'focusout .focus' : function(){
   console.log("lost");
$(".edit").hide();
}*/
"click .payBill": function (){
  var selectedOrder = this._id;
  

  var order = Orders.findOne(selectedOrder);
  //var order = Orders.find({_id:"TGmazfgvzHwvBtvBW"}).fetch()
  //alert(order.bill);
  var confirm = window.confirm("Sono "+order.bill+" euri, bello");
  
  if(confirm){
	Meteor.call('payBill',selectedOrder); 
	//Router.go('orders');	   
  }
}

});

Template.categoryListItem.events({
"click .delete": function (event, template){
  var selectedOrder= Template.parentData(0)._id;
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
"click .payItem": function	(event, template){
   var selectedOrder= Template.parentData(0)._id;
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
var ordId= Template.parentData(0)._id;
 
  
  Meteor.call('modifyPrice',
			 ordId,
			  this.product_id,
			  -1);
  
},
"click .raisePrice": function (){
	var ordId= Template.parentData(0)._id;
  Meteor.call('modifyPrice',
			  ordId,
			  this.product_id,
			  1);

},

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
Meteor.call('updateUser',user,name,attr);
console.log("update "+name+" "+attr+" "+user);

}

})

Template.variation_modals.helpers({
food_ingredient: function () {
   //return Products.find();

  return Products.find({type:"food-ingredient"});
},
'isshown': function(){
	var selectedProduct=Session.get("selectedProduct"),
	ingredient_id=this._id;
	
	var cursor = Products.find({  $and : [	{ingredients: {$elemMatch: {_id:ingredient_id}}},  {_id: selectedProduct }	]});

	
	if(cursor.count()>0){
		return "checked";
	} else {
		return "";
	}
},
'isselected': function(){
	var selectedProduct=Session.get("selectedProduct"),
	ingredient_id=this._id;
	
	var cursor = Products.find({  $and : [	{ingredients: {$elemMatch: {_id:ingredient_id, selected:true}}},  {_id: selectedProduct }  ]});

	
	if(cursor.count()>0){
		return "checked";
	} else {
		return "";
	}
	
}

});

Template.variation_modals.events({
"click .show" : function(){
	
	if($(event.target).is(':checked')) {
		var ingredient={
			_id:this._id,
			name:this.name,
			selected:$("#sel"+this._id).is(':checked')
			
		};
	   
	   Products.update(Session.get("selectedProduct"), {
	   $push: { ingredients: ingredient }}); 
	} else {
		
		Products.update(Session.get("selectedProduct"),{ 
			$pull: { ingredients: { _id: this._id } }},{ multi: false });
		}
},

"click .selected" : function(){
	var checked= $(event.target).is(':checked');
	var prod_id= Session.get("selectedProduct");
	var ingredient_id= this._id;
	Meteor.call("updateCheckedIngredients",prod_id,ingredient_id,checked);
	
}

	
});

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
  var ingredients = [];

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
'isfood': function(type){
	if(type == "food"){
		return "#foodmodal"
	}else{
		return "#drinkmodal"
	}
	
},
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
"click .ingredient" : function(){
	Session.set("selectedProduct",this._id);
	console.log(this._id);
},	
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
								  {sellable: true}, 
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
	var cursor = Orders.find({	$and : [  {items: {$elemMatch: {product_id: this._id}}},  {_id: selectedOrder }	 ]});
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
"click .payItem": function	(event, template){
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
								  {sellable: true}, 
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

  },

  'hasingredients' : function(){
	if(this.hasOwnProperty('ingredients')){
	  if(this.ingredients.length > 0){
		  return true;
		  
	  }
	  
	} 
	return false;
  }
});

Template.menuMobile.events({
  "click .add": function () {
  var selectedOrder = $(event.target).closest('div .orderId').attr('id');
  if(this.hasOwnProperty('ingredients')){
	  if(this.ingredients.length > 0){
		  
		  $("#variation_modal"+this._id).modal();
		  
	  }
	  
  } 
  
  var product_id = this._id;
	} 
});

Template.product_variation_modals.helpers({
	//only retrieves products with ingredients to build the modals
	'products' : function(){
		
		return Products.find( { $and: [	 { ingredients: { $exists: true } },{ $where: "this.ingredients.length > 0" } ] } );
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

   Orders.remove(selectedOrder);
			 
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
},


"updateCheckedIngredients": function(prod_id,ingredient_id,checked){
	Products.update(
   { _id: prod_id , "ingredients._id": ingredient_id },
   { $set: { "ingredients.$.selected" : checked }
	}
   );
	
},

"removeCategory": function(cat_id){
	 Categories.remove(cat_id);
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
