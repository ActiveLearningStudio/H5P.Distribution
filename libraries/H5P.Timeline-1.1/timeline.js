/* global TimelineJS */
/**
 * Init a H5P object.
 **/
 var H5P = H5P || {};
/**
 *
 * @param object params
 *  The object defined in content.json
 * @param int contentId
 *  The nodes vid
 */
H5P.Timeline = (function ($) {

  function C(options, contentId) {
    var self = this;
    H5P.EventDispatcher.call(self);
    var i;
    this.options = $.extend(true, {}, {
      timeline: {
        type: 'default',
        defaultZoomLevel: 0,
        language: 'en',
        height: 600
      }
    }, options);

    C.counter = (C.counter === undefined ? 0 : C.counter + 1);

    // Need to create the URL for all H5P.Images
    if (this.options.timeline.date !== undefined) {
      var dates = this.options.timeline.date;
      for(i=0; i<dates.length; i++) {
        if (dates[i].asset.thumbnail !== undefined) {
          dates[i].asset.thumbnail = H5P.getPath(dates[i].asset.thumbnail.path, contentId);
        }
      }
    }

    // Check if eras are legal - if not, remove them!
    if (this.options.timeline.era !== undefined) {
      for (i=this.options.timeline.era.length-1; i >= 0; i--) {
        if(this.options.timeline.era[i].startDate === undefined || this.options.timeline.era[i].endDate === undefined) {
          this.options.timeline.era.splice(i,1);
        }
      }
    }

    /**
     * Set background image
     * @method setBackgroundImage
     * @param  {Object}           image Image object as part of H5P content jeson
     */
    self.setBackgroundImage = function (image) {
      // Need to wait for timelinejs to be finished
      setTimeout(function () {
        var $slider = self.$container.find('.vco-slider');
        if ($slider.length !== 0) {
          $slider.css('background-image', 'url(' + H5P.getPath(image.path, contentId) + ')');
        }
        else {
          self.setBackgroundImage(image);
        }

      }, 200);
    };

    self.on('enterFullScreen', function () {
      self.$container.css('height', '100%');
      $(window).trigger('resize');
    });

    self.on('exitFullScreen', function () {
      self.$container.css('height', self.options.timeline.height + 'px');
      $(window).trigger('resize');
    });
  }

  C.prototype = Object.create(H5P.EventDispatcher.prototype);
  C.prototype.constructor = C;

  /**
   * Check if data provided is valid.
   * @method validate
   * @return {boolean} Valid or not
   */
  C.prototype.validate = function () {
    if (this.options.timeline.date === undefined || this.options.timeline.date.length === 0) {
      return false;
    }

    for (var i = 0; i < this.options.timeline.date.length; i++) {
      var element = this.options.timeline.date[i];
      if (element.startDate === undefined || element.headline === undefined) {
        return false;
      }
    }

    return true;
  };

  /**
   * Attatch the Timeline HTML to a given target.
   **/
  C.prototype.attach = function ($container) {
    var self = this;

    const id = 'h5p-timeline-' + C.counter;

    self.$container = $container;
    $container.addClass('h5p-timeline').css('height', self.options.timeline.height + 'px');
    $container.append($('<div>', {
      id: id,
      class: 'h5p-timeline-container'
    }));

    // Need to set this to make timeline behave correctly:
    window.jQuery = $;

    if (self.validate()) {
      // Load library.json - need to inform TimelineJS which version it is
      $.getJSON(self.getLibraryFilePath('library.json'), function (data) {
        new TimelineJS({
          type: 'timeline',
          width: '100%',
          height: '100%',
          source: self.options,
          lang: self.options.timeline.language,
          start_zoom_adjust: self.options.timeline.defaultZoomLevel,
          embed_id: id
        }, data.preloadedDependencies[0].majorVersion, data.preloadedDependencies[0].minorVersion);

        // Add background image if any:
        if (self.options.timeline.backgroundImage !== undefined) {
          self.setBackgroundImage(self.options.timeline.backgroundImage);
        }
      });

      const customEventInteract = self.createXAPIEventTemplate("interacted");
      if (customEventInteract.data.statement.object) {
        customEventInteract.data.statement.object.definition["description"] = {
          "en-US":"Timeline", //  this.contentData.metadata.title
        };
        customEventInteract.data.statement.object.definition["name"] ={
          "en-US":"Timeline Activity", //  this.contentData.metadata.title
        };
        customEventInteract.data.statement.object["objectType"] ="Activity";
        customEventInteract.data.statement.object["id"] ="http://adlnet.gov/expapi/activities";
        self.trigger(customEventInteract);
      }

      const customEventInteractComplete = self.createXAPIEventTemplate("completed");
      if (customEventInteractComplete.data.statement.object) {
        customEventInteractComplete.data.statement.object.definition["description"] = {
          "en-US":"Timeline", //  this.contentData.metadata.title
        };
        customEventInteractComplete.data.statement.object.definition["name"] ={
          "en-US":"Timeline Activity", //  this.contentData.metadata.title
        };
        customEventInteractComplete.data.statement.object["objectType"] ="Activity";
        customEventInteractComplete.data.statement.object["id"] ="http://adlnet.gov/expapi/activities";
        self.trigger(customEventInteractComplete);
      }

    }
    else {
      $container.append($('<div>', {
        html: 'Missing mandatory data - not able to draw the timeline. Please open this H5P in the editor, and make the necessary changes.',
        'class': 'h5p-timeline-data-not-valid'
      }));
    }
  };

  return C;
 })(H5P.jQuery);
