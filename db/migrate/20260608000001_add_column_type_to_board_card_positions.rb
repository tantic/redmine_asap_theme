class AddColumnTypeToBoardCardPositions < ActiveRecord::Migration[7.2]
  def up
    add_column :board_card_positions, :column_type, :string, default: 'status', null: false

    remove_index :board_card_positions, name: 'idx_board_card_pos_unique'
    add_index :board_card_positions, [:issue_id, :column_type, :status_id, :project_id],
              unique: true, name: 'idx_board_card_pos_unique'
  end

  def down
    remove_index :board_card_positions, name: 'idx_board_card_pos_unique'
    add_index :board_card_positions, [:issue_id, :status_id, :project_id],
              unique: true, name: 'idx_board_card_pos_unique'
    remove_column :board_card_positions, :column_type
  end
end
