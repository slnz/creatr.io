class Campaigns::CampaignController < Campaigns::BaseController
  respond_to :html, :json
  def index
    unless @campaign.nil?
      @content_types = []
      @templates = []
      @campaign.contents.each do |content|
        unless @content_types.include?(content.content_type)
          @content_types << content.content_type
          @templates << { name: content.content_type.name, content: @campaign.theme.get_content_type_template(content.content_type.id) }
        end
      end
      @content_types = @content_types.to_json(only: [:name, :js, :id, :data_count, :sync_type])
      render layout: 'campaign'
    else
      params[:action] = 'error'
      render 'lost', layout: 'campaign', status: 404
    end
  end

  def content
    @content = @campaign.contents.find_by_position(params[:id])
    @content_type = @content.content_type
  end

  def content_types
    @content_type = ContentType.find(params[:id])
  end

  def endpoint
    if params.key?(:person) && params[:person].is_a?(Hash)
      if params[:person].key? :mobile
        number = params[:person][:mobile].gsub(/[^0-9]/i, '')
        number = number[2..-1] if number[0..1] == '64'
        unless @campaign.people.exists?(mobile: number.to_i.to_s)
          p = Person.new params[:person]
          p.campaign = @campaign
          if p.valid?
            p.save
            @campaign.campaign_counters.first_or_create(date: DateTime.now.to_date).increment
            render json: { validate: true }.to_json
          else
            render json: { validate: false, errors: p.errors }.to_json
          end
          return
        end
      end
    end
    render json: { validate: false }.to_json
  end
end
