Products = new Mongo.Collection("products");
Orders = new Meteor.Collection('orders');

Router.configure({ layoutTemplate: 'main'});

Router.route('/order/:_id', {
  template: 'listOrder',
    data: function(){
      var currentOrder = this.params._id;
      return Orders.findOne({ _id: currentOrder });
       
    }
});
Router.route('/manageProducts');
Router.route('/orders');


Router.route('/', {
    name: 'home',
    template: 'home'
});


if (Meteor.isClient) {
  // This code only runs on the client
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
      var volume = parseFloat(event.target.volume.tvalue);
      var type = event.target.type.value;
      var description = event.target.description.value;
      var served = event.target.served.value;
      var sellable = event.target.sellable.checked;
    
      // Insert a task into the collection
      Products.insert({
        name: name,
        price: price,
        image: image,
        volume: volume,
        type: type,
        served: served,
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
    'keyup [name=name]': function(event){
    var documentId = this._id;
    var prod_elem = $(event.target).val();
    Products.update({ _id: documentId }, {$set: { name: prod_elem }});
    //console.log("Task changed to: " + todoItem);
    },
    'keyup [name=price]': function(event){
    var documentId = this._id;
    var prod_elem = $(event.target).val();
    Products.update({ _id: documentId }, {$set: { price: prod_elem }});
    //console.log("Task changed to: " + todoItem);
    },
    'keyup [name=volume]': function(event){
    var documentId = this._id;
    var prod_elem = $(event.target).val();
    Products.update({ _id: documentId }, {$set: { volume: prod_elem }});
    //console.log("Task changed to: " + todoItem);
    },
    'keyup [name=image]': function(event){
    var documentId = this._id;
    var prod_elem = $(event.target).val();
    Products.update({ _id: documentId }, {$set: { image: prod_elem }});
    //console.log("Task changed to: " + todoItem);
    },
    'keyup [name=type]': function(event){
    var documentId = this._id;
    var prod_elem = $(event.target).val();
    Products.update({ _id: documentId }, {$set: { type: prod_elem }});
    //console.log("Task changed to: " + todoItem);
    },
    'keyup [name=description]': function(event){
    var documentId = this._id;
    var prod_elem = $(event.target).val();
    Products.update({ _id: documentId }, {$set: { description: prod_elem }});
    //console.log("Task changed to: " + todoItem);
    },
    'keyup [name=served]': function(event){
    var documentId = this._id;
    var prod_elem = $(event.target).val();
    Products.update({ _id: documentId }, {$set: { served: prod_elem }});
    //console.log("Task changed to: " + todoItem);
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
            items: [] 
        });
        $('[name=guestName]').val('');
        $('[name=tableNum]').val('');
      }
  });

  Template.orders.helpers({
      'orders': function(){
          return Orders.find({}, {sort: {guestName: 1}});
      }

  });

  Template.orders.events({
    "click .selectOrder": function () {

      Session.set('selectedOrder', this._id);
      
    }

  });

  Template.menu.helpers({
     
      'menu_products': function(){
          return Products.find({ finished: false, sellable: true}, {sort: {type: 1}});
      }

  });

  Template.menu.events({
    "click .add": function () {
      var selectedOrder = Session.get('selectedOrder');
      
      
      
      
      if(selectedOrder != null){
        //looks for orders with selectedOrder = id that has product_id in the items array
        cursor = Orders.find({  $and : [  {items: {$elemMatch: {product_id: this._id}}},  {_id: selectedOrder }  ]});
        if(cursor.count()>0){
          Orders.update(selectedOrder, {
            //modify quantity
            //{user_id : 123456 , "items.item_name" : "my_item_two" } , {$inc : {"items.$.price" : 1} }  

            $inc: { bill: parseFloat(this.price) }
          
          });

        }
        else{

          var item = {
          product_id:  this._id,
          name: this.name,
          volume: this.volume,
          price:  this.price,
          image:  this.image, 
          quantity: 1
          };
        
          console.log(item);
          Orders.update(selectedOrder, {
            $push: { items: item },
            $inc: { bill: parseFloat(item.price) }
          
          });

        }
        
        //if (addOrder){alert(addOrder.count());}

        

      }
      else alert("didn't choose an order");
      
    }

  });

  Template.listOrder.events({
    "click .delete": function (){
      var prod_id= this.product_id;
      var price = parseFloat(this.price);
      var quantity = parseInt(this.quantity);
      
      var confirm = window.confirm("Delete this order ?");
      if(confirm){
        var selectedOrder = Session.get('selectedOrder');
        //alert( Session.get('selectedOrder'));
        if (quantity > 1){

          Orders.update(selectedOrder,{$inc: { quantity: -1 }},{ multi: false });
          Orders.update(selectedOrder,{$inc: { bill: -(price) }},{ multi: false });

        }else{

          Orders.update(selectedOrder,{ $pull: { items: { product_id: prod_id } } },{ multi: false });
          Orders.update(selectedOrder,{$inc: { bill: -(price) }},{ multi: false });

        }

      
      }
    }

  });

}

if(Meteor.isServer){
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



