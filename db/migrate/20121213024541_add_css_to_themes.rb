class AddCssToThemes < ActiveRecord::Migration
  def change
    add_column :themes, :css, :text
  end
end
