#   Copyright (c) 2010-2011, Diaspora Inc.  This file is
#   licensed under the Affero General Public License version 3 or later.  See
#   the COPYRIGHT file.
require 'spec_helper'

describe Rack::ChromeFrame do

  before :all do
    @app = Rack::Builder.parse_file(Rails.root.join('config.ru').to_s).first
  end

  before :each do
    @response = get_response_for_user_agent(@app, ua_string);
  end

  subject { @response }

  context "non-IE browser" do
    let(:ua_string) { "another browser chromeframe" }

    it "shouldn't complain about the browser" do
      subject.body.should_not =~ /chrome=1/
      subject.body.should_not =~ /Diaspora doesn't support your version of Internet Explorer/
    end
  end

  context "IE8 without chromeframe" do
    let(:ua_string) { "MSIE 8" }

    it "shouldn't complain about the browser" do
      subject.body.should_not =~ /chrome=1/
      subject.body.should_not =~ /Diaspora doesn't support your version of Internet Explorer/
    end
  end

  context "IE7 without chromeframe" do
    let(:ua_string) { "MSIE 7" }

    it "shouldn't complain about the browser" do
      subject.body.should_not =~ /chrome=1/
      subject.body.should =~ /Diaspora doesn't support your version of Internet Explorer/
    end
    specify {@response.headers["Content-Length"].should == @response.body.length.to_s}
  end

  context "any IE with chromeframe" do
    let(:ua_string) { "MSIE number chromeframe" }

    it "shouldn't complain about the browser" do
      subject.body.should =~ /chrome=1/
      subject.body.should_not =~ /Diaspora doesn't support your version of Internet Explorer/
    end
    specify {@response.headers["Content-Length"].should == @response.body.length.to_s}
  end
end
