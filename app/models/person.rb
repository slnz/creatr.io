class Person < ActiveRecord::Base
  belongs_to :campaign
  has_many :answers, dependent: :destroy
  accepts_nested_attributes_for :answers
  attr_accessible :facebook_access_token, :facebook_id, :first_name, :last_name, :phone, :mobile, :sms_token, :email, :gender, :answers_attributes
  attr_reader :sms_validated, :photo_validated, :synced
  before_validation :generate_code, on: :create
  before_create :get_extended_token
  after_create :send_sms
  validates_presence_of :first_name, :campaign, :mobile
  validates_uniqueness_of :mobile, scope: :campaign_id
  has_one :photo, dependent: :destroy
  scope :find_by_full_name, lambda {|full_name|
    { conditions: ['people.sms_validated = false and (upper(people.first_name) LIKE upper(?) or upper(people.last_name) LIKE upper(?))', "%#{full_name.split(' ').first}%", "%#{full_name.split(' ').last}%"] }
  }

  def upload_photo(file)
    @photo = Photo.new(person: self)
    @photo.file = file
    @photo.person = self
    @photo.save
  end

  def fb_sync
    unless photo.blank? || campaign.fb_page.blank? || photo_validated?

      # mark db
      unless photo_validated
        self.photo_validated = true
        save
      end

      # get page permissions
      @member_graph = Koala::Facebook::API.new(campaign.members.first.token)
      @page_token = @member_graph.get_page_access_token(campaign.fb_page)
      @page_graph = Koala::Facebook::API.new(@page_token)

      # publish photo on page
      photo = @page_graph.put_picture(self.photo.file.url, message: "#{first_name} got #{if gender == 'male' then 'his' else 'her' end} free sunnies at uni from us! www.slnz.co")

      unless facebook_access_token.blank?
        begin
          # get access token
          @person_graph = Koala::Facebook::API.new(facebook_access_token)

          # like photo
          @person_graph.put_like(photo['post_id'])

          # share
          @person_graph.put_picture(self.photo.file.url, message: 'I got my free sunnies at uni from Student Life! www.slnz.co')
        rescue
          # FB Token Invalid
        end
      end
    end
  end

  def sms_validate
    self.sms_validated = true
    save
  end

  def mobile=(number)
    unless number.blank? && number.length < 3
      number = number.gsub(/[^0-9]/i, '')
      number = number[2..-1] if number[0..1] == '64'
      super(number.to_i)
    end
  end

  def sync
    crm_base_model = "#{campaign.organisation.crm.name}Crm"
    crm_base_model = Kernel.const_get(crm_base_model)
    crm_base_model.sync(self, campaign)
    self.synced = true
    save
  end

  def send_sms
    if !mobile.blank? && !campaign.sms_template.blank?
      begin
        # @client = Twilio::REST::Client.new(ENV['sms_sid'], ENV['sms_token'])
        # @account = @client.account
        # @message = @account.sms.messages.create({:from => '+17784021163', :to => "+64#{self.mobile}", :body =>  })
        SmsDevice.find(:first, order: 'updated_at ASC').try(:send_sms, "+64#{mobile}", "#{campaign.sms_template.gsub(/\[fname\]/, first_name)} #{sms_token}")
      rescue => ex
        # fake number
      end
    end
  end

  private

  def generate_code
    begin
      token = rand(10_000..99_999)
    end while Person.where(sms_token: token.to_s).exists?
    self.sms_token = token
  end

  def get_extended_token
    # Create a new koala Oauth object.
    unless facebook_access_token.blank?
      begin
        oauth = Koala::Facebook::OAuth.new(344_474_969_028_297, 'da9449bde617bc9e20deaf9e25e9c38c')
        self.facebook_access_token = oauth.exchange_access_token(facebook_access_token)
      rescue => ex
        self.facebook_access_token = ''
      end
    end
  end
end
