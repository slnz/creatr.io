class Member < ActiveRecord::Base
  has_many :member_crms
  has_many :crms, through: :member_crms

  has_many :permissions
  has_many :campaigns, through: :permissions

  has_many :member_organisations
  has_many :organisations, through: :member_organisations, dependent: :destroy

  has_many :favourites, dependent: :destroy

  has_many :themes, dependent: :nullify, foreign_key: 'owner_id'

  devise :omniauthable, :confirmable, :registerable
  attr_accessible :email, :encrypted_password, :password_confirmation, :remember_me, :provider, :uid, :name, :token, :usage, :tokenExpires, :stripe
  validates_presence_of :email, :name, :uid, :provider
  validates_uniqueness_of :email, :uid

  def self.find_for_facebook_oauth(auth)
    @member = Member.where(provider: auth.provider, uid: auth.uid).first
    unless @member.blank?
      @member.token = auth.credentials.token
      @member.save
    end
    @member
  end

  def only_if_unconfirmed
    pending_any_confirmation { yield }
  end

  def activate
    self.activated = true
    save
  end

  def deactivate
    self.activated = false
    save
  end

  def promote
    self.admin = true
    save
  end

  def demote
    self.admin = false
    save
  end
end
