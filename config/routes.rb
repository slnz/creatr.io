FlamingWight::Application.routes.draw do

  get "create/index"

  get "billing/index"

  devise_for :members, :controllers => { :omniauth_callbacks => "members/omniauth_callbacks"}

  devise_scope :members do
    get 'sign_in', :to => 'devise/sessions#new', :as => :new_session
    get 'sign_out', :to => 'devise/sessions#destroy', :as => :destroy_user_session
    put 'confirm' => 'confirmations#confirm'
  end

  root :to => "site#index"
  match 'features' => "site#features"
  match 'testimonials' => "site#testimonials"
  match 'pricing' => "site#pricing"
  match 'signup' => 'site#signup'
  match 'activate' => 'site#activate'
  get 'signup_fb' => 'site#signup_fb'
  post 'signup_fb' => 'site#createUser'
  get 'signup_done' => 'site#signup_done'

  match 'dashboard' => 'dashboard#index'
  match 'dashboard/billing' => 'dashboard#billing'
  match 'dashboard/new' => 'create#index'
  match 'member_root' => 'site#features', :as => :dashboard
end
