H5PEditor.SelectEpubChapter = (function ($) {


  function SelectEpubChapter(parent, field, params, setValue) {
    var self = this;

    // Set default value:
    params = params || '';

    self.field = field;
    // Outsource readies
    self.passReadies = true;
    self.value = params;

    parent.ready(function () {
      setValue(self.field, params);
    });

    var $epubPreviewContainer = $('<div>', {
      id: 'epub-editor-preview-container'
    });

    // On Remove epub File
    parent.children[0].confirmRemovalDialog.on('confirmed', function () {
      $epubPreviewContainer.html('');
    });

    parent.children[0].on('uploadComplete', function(uploadComplete) {
      self.$epub = $('<div>', {
        id: 'editor-viewer'
      });

      var $list = $('<div>', {
        id: 'toc-view'
      });

      $epubPreviewContainer.append($list);
      $epubPreviewContainer.append(self.$epub);


      if (!parent.hasOwnProperty("parent") || typeof parent.parent === 'undefined') {
        parent.$form.append($epubPreviewContainer);
      } else {
        parent.$myField.append($epubPreviewContainer);
      }

      const url = H5P.getPath(uploadComplete.data.data.path, H5PEditor.contentId)

      var book = ePub(url);

      var rendition  = book.renderTo(self.$epub[0], {
        width: "100%",
        height: 600
      });

      rendition.display();

      book.loaded.navigation.then(function(toc){


        rendition.on('rendered', chapterChange);

        var tocItems = generateTocItems(toc);
        var docfrag = document.createDocumentFragment();
        docfrag.appendChild(tocItems);

        $list.append(docfrag);
        $list.find(".toc_link").on("click", function(event){
          var hrefUrl = this.getAttribute('href');

          event.preventDefault();
          rendition.display(hrefUrl);

          $list.find(".currentChapter")
          .addClass("openChapter")
          .removeClass("currentChapter");

          $(this).parent('li').addClass("currentChapter");

          setValue(self.field, hrefUrl);

        });

        $list.find(".toc_toggle").on("click", function(event){
          var $el = $(this).parent('li'),
              open = $el.hasClass("openChapter");

          event.preventDefault();
          if(open){
            $el.removeClass("openChapter");
          } else {
            $el.addClass("openChapter");
          }
        });

        if (self.value) {
          $list.find(".toc_link").forEach((a) => {
            var hrefUrl = this.getAttribute('href');
            if(hrefUrl === self.value) {
              a.click();
            }
          })
        }

      });
    });

    var generateTocItems = function(toc, level) {
      var container = document.createElement("ul");

      if(!level) level = 1;

      toc.forEach(function(chapter) {
        var listitem = document.createElement("li"),
            link = document.createElement("a");
        toggle = document.createElement("a");

        var subitems;

        listitem.id = "toc-"+chapter.id;
        listitem.classList.add('list_item');

        link.textContent = chapter.label;
        link.href = chapter.href;

        link.classList.add('toc_link');

        listitem.appendChild(link);

        if(chapter.subitems && chapter.subitems.length > 0) {
          level++;
          subitems = generateTocItems(chapter.subitems, level);
          toggle.classList.add('toc_toggle');

          listitem.insertBefore(toggle, link);
          listitem.appendChild(subitems);
        }


        container.appendChild(listitem);

      });

      return container;
    };

    var chapterChange = function(e) {
      $list.find('.openChapter');
      var id = e.id,
          $item = $list.find("#toc-"+id),
          $current = $list.find(".currentChapter");

      if($item.length){

        if($item !== $current && $item.has(currentChapter).length > 0) {
          $current.removeClass("currentChapter");
        }

        $item.addClass("currentChapter");

        $item.parents('li').addClass("openChapter");
      }
    };


    /**
     *
     */
    self.appendTo = function ($wrapper) {
    };

    /**
     * Always validate
     * @return {boolean}
     */
    self.validate = function () {
      return true;
    };

    self.remove = function () {

    };
  }

  return SelectEpubChapter;
})(H5PEditor.$);

// Register widget
H5PEditor.widgets.selectEpubChapter = H5PEditor.SelectEpubChapter;
