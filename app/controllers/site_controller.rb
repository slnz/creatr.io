class SiteController < ApplicationController
	def index

	end

	def features

	end

	def testimonials

	end

	def pricing

	end

  def signup

  end

  def signup_fb
  	if session.exists? && !session["devise.facebook_data"].nil?
	  	@name = session["devise.facebook_data"]['info']['name']  || ""
	  	@email = if session["devise.facebook_data"]['info']['email'].include?("@facebook.com")
	  		""
		else
			session["devise.facebook_data"]['info']['email']
		end

  	else
    	redirect_to member_omniauth_authorize_path(:facebook)
	end
  end




end
