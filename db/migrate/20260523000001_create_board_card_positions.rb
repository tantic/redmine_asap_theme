class CreateBoardCardPositions < ActiveRecord::Migration[7.2]
  def change
    create_table :board_card_positions do |t|
      t.integer :issue_id,   null: false
      t.integer :status_id,  null: false
      t.integer :project_id, null: false
      t.integer :position,   null: false, default: 0
    end
    add_index :board_card_positions, [:issue_id, :status_id, :project_id],
              unique: true, name: 'idx_board_card_pos_unique'
    add_index :board_card_positions, [:project_id, :status_id, :position],
              name: 'idx_board_card_pos_order'
  end
end
