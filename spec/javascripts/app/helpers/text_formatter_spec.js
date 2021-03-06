describe("app.helpers.textFormatter", function(){

  beforeEach(function(){
    this.statusMessage = factory.post();
    this.formatter = app.helpers.textFormatter;
  });

  // Some basic specs. For more detailed specs see
  // https://github.com/svbergerem/markdown-it-hashtag/tree/master/test
  context("hashtags", function() {
    beforeEach(function() {
      this.tags = [
        "tag",
        "diaspora",
        "PARTIES",
        "<3"
      ];
    });

    it("renders tags as links", function() {
      var formattedText = this.formatter('#'+this.tags.join(" #"));
      _.each(this.tags, function(tag) {
        var link ='<a href="/tags/'+tag.toLowerCase()+'" class="tag">#'+tag.replace("<","&lt;")+'</a>';
        expect(formattedText).toContain(link);
      });
    });
  });

  // Some basic specs. For more detailed specs see
  // https://github.com/diaspora/markdown-it-diaspora-mention/tree/master/test
  context("mentions", function() {
    beforeEach(function(){
      this.alice = factory.author({
        name : "Alice Smith",
        diaspora_id : "alice@example.com",
        id : "555"
      });

      this.bob = factory.author({
        name : "Bob Grimm",
        diaspora_id : "bob@example.com",
        id : "666"
      });

      this.statusMessage.set({text: "hey there @{Alice Smith; alice@example.com} and @{Bob Grimm; bob@example.com}"});
      this.statusMessage.set({mentioned_people : [this.alice, this.bob]});
    });

    it("matches mentions", function(){
      var formattedText = this.formatter(this.statusMessage.get("text"), this.statusMessage.get("mentioned_people"));
      var wrapper = $("<div>").html(formattedText);

      _.each([this.alice, this.bob], function(person) {
        expect(wrapper.find("a[href='/people/" + person.guid + "']").text()).toContain(person.name);
      });
    });

    it("returns mentions for on posts that haven't been saved yet (framer posts)", function(){
      var freshBob = factory.author({
        name : "Bob Grimm",
        handle : "bob@example.com",
        url : 'googlebot.com',
        id : "666"
      });

      this.statusMessage.set({'mentioned_people' : [freshBob] });

      var formattedText = this.formatter(this.statusMessage.get("text"), this.statusMessage.get("mentioned_people"));
      var wrapper = $("<div>").html(formattedText);
      expect(wrapper.find("a[href='googlebot.com']").text()).toContain(freshBob.name);
    });

    it('returns the name of the mention if the mention does not exist in the array', function(){
      var text = "hey there @{Chris Smith; chris@example.com}";
      var formattedText = this.formatter(text, []);
      expect(formattedText.match(/<a/)).toBeNull();
      expect(formattedText).toContain('Chris Smith');
    });
  });

  context("markdown", function(){
    it("autolinks", function(){
      var links = [
        "http://google.com",
        "https://joindiaspora.com",
        "http://www.yahooligans.com",
        "http://obama.com",
        "http://japan.co.jp",
        "www.mygreat-example-website.de",
        "www.jenseitsderfenster.de",  // from issue #3468
        "www.google.com",
        "xmpp:podmin@pod.tld",
        "mailto:podmin@pod.tld"
      ];

      var formattedText = this.formatter(links.join(" "));
      var wrapper = $("<div>").html(formattedText);

      _.each(links, function(link) {
        var linkElement = wrapper.find("a[href*='" + link + "']");
        expect(linkElement.text()).toContain(link);
        expect(linkElement.attr("target")).toContain("_blank");
      });
    });

    context("symbol conversion", function() {
      beforeEach(function() {
        this.input_strings = [
          "->", "<-", "<->",
          "(c)", "(r)", "(tm)",
          "<3"
        ];
        this.output_symbols = [
          "→", "←", "↔",
          "©", "®", "™",
          "♥"
        ];
      });

      it("correctly converts the input strings to their corresponding output symbol", function() {
        _.each(this.input_strings, function(str, idx) {
          var text = this.formatter(str);
          expect(text).toContain(this.output_symbols[idx]);
        }, this);
      });

      it("converts all symbols at once", function() {
        var text = this.formatter(this.input_strings.join(" "));
        _.each(this.output_symbols, function(sym) {
          expect(text).toContain(sym);
        });
      });
    });

    context("non-ascii url", function() {
      beforeEach(function() {
        /* jshint -W100 */
        this.evilUrls = [
          "http://www.bürgerentscheid-krankenhäuser.de", // example from issue #2665
          "http://bündnis-für-krankenhäuser.de/wp-content/uploads/2011/11/cropped-logohp.jpg",
          "http://موقع.وزارة-الاتصالات.مصر/", // example from #3082
          "http:///scholar.google.com/citations?view_op=top_venues",
          "http://lyricstranslate.com/en/someone-you-നിന്നെ-പോലൊരാള്‍.html", // example from #3063,
          "http://de.wikipedia.org/wiki/Liste_der_Abkürzungen_(Netzjargon)", // #3645
          "http://wiki.com/?query=Kr%E4fte", // #4874
        ];
        /* jshint +W100 */
        this.asciiUrls = [
          "http://www.xn--brgerentscheid-krankenhuser-xkc78d.de",
          "http://xn--bndnis-fr-krankenhuser-i5b27cha.de/wp-content/uploads/2011/11/cropped-logohp.jpg",
          "http://xn--4gbrim.xn----ymcbaaajlc6dj7bxne2c.xn--wgbh1c/",
          "http:///scholar.google.com/citations?view_op=top_venues",
          "http://lyricstranslate.com/en/someone-you-%E0%B4%A8%E0%B4%BF%E0%B4%A8%E0%B5%8D%E0%B4%A8%E0%B5%86-%E0%B4%AA%E0%B5%8B%E0%B4%B2%E0%B5%8A%E0%B4%B0%E0%B4%BE%E0%B4%B3%E0%B5%8D%E2%80%8D.html",
          "http://de.wikipedia.org/wiki/Liste_der_Abk%C3%BCrzungen_(Netzjargon)",
          "http://wiki.com/?query=Kr%E4fte",
        ];
      });

      it("correctly encodes to punycode", function() {
        _.each(this.evilUrls, function(url, num) {
          var text = this.formatter(url);
          expect(text).toContain(this.asciiUrls[num]);
        }, this);
      });

      it("doesn't break link texts", function() {
        var linkText = "check out this awesome link!";
        var text = this.formatter( "["+linkText+"]("+this.evilUrls[0]+")" );

        expect(text).toContain(this.asciiUrls[0]);
        expect(text).toContain(linkText);
      });

      it("doesn't break reference style links", function() {
        var postContent = "blabla blab [my special link][1] bla blabla\n\n[1]: "+this.evilUrls[0]+" and an optional title)";
        var text = this.formatter(postContent);

        expect(text).not.toContain('"'+this.evilUrls[0]+'"');
        expect(text).toContain(this.asciiUrls[0]);
      });

      it("can be used as img src", function() {
        var postContent = "![logo]("+ this.evilUrls[1] +")";
        var niceImg = 'src="'+ this.asciiUrls[1] +'"'; // the "" are from src=""
        var text = this.formatter(postContent);

        expect(text).toContain(niceImg);
      });

      it("doesn't break linked images", function() {
        var postContent = "I am linking an image here [![some-alt-text]("+this.evilUrls[1]+")]("+this.evilUrls[3]+")";
        var text = this.formatter(postContent);
        var linked_image = 'src="'+this.asciiUrls[1]+'"';
        var image_link = 'href="'+this.asciiUrls[3]+'"';

        expect(text).toContain(linked_image);
        expect(text).toContain(image_link);
      });
    });

    context("misc breakage and/or other issues with weird urls", function(){
      it("doesn't crash Firefox", function() {
        var content = "antifaschistisch-feministische ://";
        var parsed = this.formatter(content);
        expect(parsed).toContain(content);
      });

      it("doesn't crash Chromium - RUN ME WITH CHROMIUM! (issue #3553)", function() {

        var text_part = 'Revert "rails admin is conflicting with client side validations: see https://github.com/sferik/rails_admin/issues/985"';
        var link_part = 'https://github.com/diaspora/diaspora/commit/61f40fc6bfe6bb859c995023b5a17d22c9b5e6e5';
        var content = '['+text_part+']('+link_part+')';
        var parsed = this.formatter(content);

        var link = 'href="' + link_part + '"';
        var text = '>Revert “rails admin is conflicting with client side validations: see https://github.com/sferik/rails_admin/issues/985”<';

        expect(parsed).toContain(link);
        expect(parsed).toContain(text);
      });

      context("percent-encoded input url", function() {
        beforeEach(function() {
          this.input = "http://www.soilandhealth.org/01aglibrary/010175.tree%20crops.pdf";  // #4507
          this.correctHref = 'href="'+this.input+'"';
        });

        it("doesn't get double-encoded", function(){
          var parsed = this.formatter(this.input);
          expect(parsed).toContain(this.correctHref);
        });

        it("gets correctly decoded, even when multiply encoded", function() {
          var uglyUrl = encodeURI(encodeURI(encodeURI(this.input)));
          var parsed = this.formatter(uglyUrl);
          expect(parsed).toContain(this.correctHref);
        });
      });

      it("doesn't fail for misc urls", function() {
        var contents = [
          'https://foo.com!',
          'ftp://example.org:8080'
        ];
        var results = [
          '<p><a href="https://foo.com" target="_blank">https://foo.com</a>!</p>',
          '<p><a href="ftp://example.org:8080" target="_blank">ftp://example.org:8080</a></p>'
        ];
        for (var i = 0; i < contents.length; i++) {
          expect(this.formatter(contents[i])).toContain(results[i]);
        }
      });
    });
  });

  context("real world examples", function(){
    it("renders them as expected", function(){
      var contents = [
        'oh, cool, nginx 1.7.9 supports json autoindexes: http://nginx.org/en/docs/http/ngx_http_autoindex_module.html#autoindex_format'
      ];
      var results = [
        '<p>oh, cool, nginx 1.7.9 supports json autoindexes: <a href="http://nginx.org/en/docs/http/ngx_http_autoindex_module.html#autoindex_format" target="_blank">http://nginx.org/en/docs/http/ngx_http_autoindex_module.html#autoindex_format</a></p>'
      ];
      for (var i = 0; i < contents.length; i++) {
        expect(this.formatter(contents[i])).toContain(results[i]);
      }
    });
  });
});
