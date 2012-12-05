//Testing this out
$.fn.extend({
  safeClone: function() {
    var clone = this;
    prev = clone.prev();
    clone = prev.add(clone);
    clone = clone.add(clone.next());
    
    clone = $(clone).clone();
    console.log(clone);
    return clone;
  }
});

content_id_counter = 0;

App = Ember.Application.create({
  rootElement: '#emberContainer'
});

App.Surveys = Ember.Object.create({
  name: null,
  start: $.datepicker.formatDate('mm/dd/yy' , new Date()),
  end: $.datepicker.formatDate('mm/dd/yy' , new Date()),
  themeID: 0,
  contents: [],    //Pushing an instance of App.SurveyContent onto this
  contentsNameObserver: function() {
    context = this;
    if(this.get('contents.lastObject').name) {
      context.contents.pushObject(App.SurveyContent.create());  
    }
  }.observes("contents.lastObject.name"),

  moveItem: function(fromIndex, toIndex){
    console.log(fromIndex, toIndex);
    var items = this.get('contents');
    item = items.objectAt(fromIndex);
    //items.removeAt(fromIndex);
    //items.insertAt(toIndex, item);
  },
});

App.SurveyContent = Ember.Object.extend({
  init: function() {
    this.set('id', 'content'+content_id_counter);
    this.set('idhref', '#content'+content_id_counter);
    this.set('id2', 'outer_content'+content_id_counter);
    content_id_counter++;
  },
  name: "",
  content_type: 1,
  content_pos: function() {
    return Ember.get('App.Surveys.contents').indexOf(this) + 1;
  }.property(),

  hash: Em.A([]),

  types: function() {
    return App.ContentTypes.findProperty('id', this.content_type).hash;
  }.property(),

  delete: function(event) {
    if(App.Surveys.contents.length > 1)
      App.Surveys.contents.removeObject(this)
  }

});


App.ContentTypes = [
  Ember.Object.create({name: 'Text question', id:1, hash: [Ember.Object.create({name: 'Question', help: 'Enter the question here', type: 'text'})]}),

  Ember.Object.create({name: 'Multichoice question', id:2, hash: [Ember.Object.create({name: 'Multichoice Question', help: 'Enter the question here', type: 'text'}), 
                        Ember.Object.create({name: 'Answer', help: 'Enter possible answers here', type: 'text', multiple: true})]})
];

App.ViewTypeConvention = Ember.Mixin.create({
  viewType: function() {
    return Em.get("Ember.TextField");
  }.property().cacheable()
});


App.CRMData = Ember.Object.extend();

App.CRMData.reopenClass ({
  crm_data: [],
  org_data: [],
  org_display_data: [],

  loadData: function() {
    context = this;
    context.crm_data = [];
    $.getJSON ("ajax/crm_data", function(data) {
      data.forEach(function(crm) {
        context.crm_data.pushObject(App.CRMData.create({id: crm.crm_id, name: crm.crm_name}));
        crm.orgs.forEach(function(org) {
          context.org_data.pushObject(App.CRMData.create({id: org.org_id, name: org.org_name, crm_id: crm.crm_id}));
        }, context)
      }, context)
      context.updateOrganisations(5);
    }); 
    return this.crm_data;
  },
  updateOrganisations: function(crm_id) {
    context = this;
    this.org_display_data.clear();
    console.log("clearing the buffer")
    console.log(this.org_display_data)
    context.org_data.forEach(function(org) {
      if(org.crm_id == crm_id) {
        context.org_display_data.pushObject(App.CRMData.create({id: org.id, name: org.name}));
      }
    }, context)
  }
});

App.DateField = Ember.TextField.extend({
  attributeBindings: ['id', 'class']
});

App.CRMSelect = Ember.Select.extend({
  attributeBindings: ['id'],
  change: function(evt) {
    console.log(evt)
    App.CRMData.updateOrganisations($('#crm').val())
  }
});

App.ApplicationController = Ember.Controller.extend();

App.Step1Controller = Ember.ArrayController.extend({});

App.Step2Controller = Ember.ArrayController.extend({});

App.Step3Controller = Ember.ArrayController.extend({});

App.Step4Controller = Ember.ArrayController.extend({});

App.ApplicationView = Ember.View.extend({
  templateName: 'app'
});

App.Step0View = Ember.View.extend ({
  templateName: 'templates/step0'
});

App.Step1View = Ember.View.extend ({
  templateName: 'templates/step1'
});

App.Step2View = Ember.View.extend ({
  templateName: 'templates/step2',
  didInsertElement: function() {
    $( ".jquery-ui-datepicker" ).datepicker();
  }
});

App.Step3View = Ember.View.extend ({
  templateName: 'templates/step3',
  didInsertElement: function() {
    if(App.Surveys.contents.length == 0)
      App.Surveys.contents.pushObject(App.SurveyContent.create());
    $('#accordion').sortable({
      axis: "y",
      start: function(event, ui) {
        ui.item.previousIndex = App.Step3View.findIndex(ui.item.attr('id'));
      },
      update: function(event, ui) {
        App.Surveys.moveItem(ui.item.previousIndex, App.Step3View.findIndex(ui.item.attr('id')));
      },
      helper: function(event, ui) {
        test = $(ui).safeClone();
        console.log(test);
        return test;
      }
    });
  },
});

App.Step3View.reopenClass( {
  findIndex: function(id) {
    order = $('#accordion').sortable("toArray");
    i = 0;
    while(i < order.length) {
      if(order[i].indexOf("outer_content") == -1)
        order.removeAt(i);
      else
        i++;
    }
    console.log(order);
    return order.indexOf(id);
  } 
})

App.Step4View = Ember.View.extend ({
  templateName: 'templates/step4',
});


App.Router = Em.Router.extend ({
  enableLogging: true,

  root: Em.Route.extend ({
    showstep1: Ember.Route.transitionTo('step1'),
    showstep2: Ember.Route.transitionTo('step2'),
    showstep3: Ember.Route.transitionTo('step3'),
    showstep4: Ember.Route.transitionTo('step4'),

    index: Ember.Route.extend({
      route: '/',
      connectOutlets: function(router){
        router.get('applicationController').connectOutlet( 'step0');
      }      
    }),

    step1: Ember.Route.extend ({
      route: 'step1',
      connectOutlets: function(router){
        router.get('applicationController').connectOutlet( 'step1', App.CRMData.loadData());
      }
    }),

    step2: Ember.Route.extend ({
      route: 'step2',
      connectOutlets: function(router) {
        router.get('applicationController').connectOutlet('step2')
      },
    }),

    step3: Ember.Route.extend ({
      route: 'step3',
      connectOutlets: function(router) {
        router.get('applicationController').connectOutlet('step3')
      },
    }),
    step4: Ember.Route.extend ({
      route: 'step4',
      connectOutlets: function(router) {
        router.get('applicationController').connectOutlet('step4')
      },
    })
  })
});


//Ember.LOG_BINDINGS=true;

App.ContentTypes.forEach(function(object) {
  object.hash.forEach(function(hash) {
    hash.reopen(App.ViewTypeConvention);
  }, this);
}, this);

    // fromIndex += 1;
    // toIndex += 1;
    // this.contents.forEach(function(content){
    //   content_pos_temp = content.get('content_pos');
    //   if(content_pos_temp == fromIndex) 
    //     content.set('content_pos', toIndex);
    //   else if(content_pos_temp > toIndex)
    //     content.incrementProperty('content_pos');
    //   else if(content.content_pos >= fromIndex)
    //     content.decrementProperty('content_pos');
    // }, this);