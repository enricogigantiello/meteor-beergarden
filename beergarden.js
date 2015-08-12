Products = new Mongo.Collection("products");
Router.configure({
    layoutTemplate: 'main'
});


Router.route('/register');


Router.route('/', {
    name: 'home',
    template: 'home'
});


if (Meteor.isClient) {
  // This code only runs on the client
  Template.body.helpers({
    products: function () {
      return Products.find();
    }
  });

  Template.body.events({
    "submit .new-prod": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
 
      // Get value from form element
      var name = event.target.name.value;
      var price = parseInt(event.target.price.value);
      var image = event.target.image.value;
      var volume = parseFloat(event.target.volume.value);
      var type = event.target.type.value;
      var description = event.target.description.value;
    
     
      // Insert a task into the collection
      Products.insert({
        name: name,
        price: price,
        image: image,
        volume: volume,
        type: type,
        description: description,
        finished: false
        
        //createdAt: new Date() // current time
      });
 
      // Clear form
      
      event.target.name.value= "";
      event.target.price.value= "";
      event.target.image.value= "";
      event.target.volume.value= "";
      event.target.type.value= "";
      event.target.description.value= "";
    }
  });

  Template.product.helpers({
    'checked': function(){
        var isFinished = this.finished;
        if(isFinished){
            return "checked";
        } else {
            return "";
        }
    }
});

  Template.product.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Products.update(this._id, {
        $set: {finished: ! this.finished}
      });
    },
    "click .delete": function () {
      var confirm = window.confirm("Delete this task?");
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
    }
  });
}

if(Meteor.isServer){
    // server code goes here
}