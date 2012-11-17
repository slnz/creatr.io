class ApplicationController < ActionController::Base
	protect_from_forgery

	def after_sign_in_path_for(resource_or_scope)
  		'/dashboard'
	end

	def instantiate_controller_and_action_names
      @current_action = controller.action_name
      @current_controller = controller.controller_name
  	end
end
