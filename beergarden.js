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
Router.route('/schedules');

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
            payedItems: [] 
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
        console.log(JSON.stringify(chunks));
        return chunks;
      }

  });

  Template.orders.events({
    "click .selectOrder": function () {
      Session.set('selectedOrder', this._id);      
    },
    "click .pay": function (){
      var selectedOrder = this._id;
      alert(selectedOrder);

      var order = Orders.findOne(selectedOrder);
      //var order = Orders.find({_id:"TGmazfgvzHwvBtvBW"}).fetch()
      //alert(order.bill);
      var confirm = window.confirm("Sono "+order.bill+" euri, bello");
      
      if(confirm){
        Meteor.call('payBill',selectedOrder); 
        Router.go('orders');       
      }
    },
     "click .delete": function (){
      var confirm = window.confirm("Delete the order: "+this.guestName +" Tab: "+this.tableNum+" ?");
      if(confirm){
        var selectedOrder = this._id;
        console.log( selectedOrder);
          
        Meteor.call('remOrder',selectedOrder);
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
        console.log(distinctEntries);

        var result = [];
        for (var i = 0; i < distinctEntries.length; i++) {
          res={};
          res.name = distinctEntries[i];
          res.products = Products.find({ type: distinctEntries[i], finished: false, sellable: true}, {sort: {type: 1, served: 1, name: 1}});
          
          result[i] = res;
          //result[distinctEntries[i]].name=distinctEntries[i];
          //result[distinctEntries[i]].products = Products.find({ type: distinctEntries[i], finished: false, sellable: true}, {sort: {type: 1, served: 1, name: 1}});
        }
  

        console.log(result);

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
        cursor = Orders.find({  $and : [  {items: {$elemMatch: {product_id: this._id}}},  {_id: selectedOrder }  ]});
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

  Template.listOrder.events({
    "click .delete": function (){
      var prod_id= this.product_id;
      

      var quantity = parseInt(this.quantity);
      
      var confirm = window.confirm("Delete one "+this.name+" from this order ?");
      if(confirm){
        var selectedOrder = Session.get('selectedOrder');
        //alert( Session.get('selectedOrder'));
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
    "click .payItem": function (){

      var selectedOrder = Session.get('selectedOrder');
     
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

  Template.schedules.helpers({
    'dates' : function(){
      console.log(getMonday(new Date()));
      var dates=[];
      return dates;

    },


  });

  

}

if(Meteor.isServer){
    Meteor.methods({

    'addQuantity': function(selectedOrder, product_id,price){
      console.log(selectedOrder+" "+product_id);

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
      console.log(selectedOrder+" "+product_id);

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
      //console.log(selectedOrder+" "+product_id);
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
                 
    }

});



  /* uncomment to have rest services



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
*/


}


Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
}

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push( new Date (currentDate) )
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
      var monday = new Date(d.setDate(diff));
      var dateArray = new Array();
      for (var i = 0; i <7 ; i++) {
        dateArray.push( new Date (monday.addDays(i)) );

        
      };
  return dateArray;
}

 // Mon Nov 08 2010
