package com.library.management.ui.borrows;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.library.management.R;
import com.library.management.model.Borrow;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class BorrowAdapter extends RecyclerView.Adapter<BorrowAdapter.BorrowViewHolder> {
    private List<Borrow> borrows;
    private OnBorrowClickListener listener;
    private SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());

    public interface OnBorrowClickListener {
        void onBorrowClick(Borrow borrow);
        void onReturnClick(Borrow borrow);
        void onDeleteClick(Borrow borrow);
    }

    public BorrowAdapter(List<Borrow> borrows, OnBorrowClickListener listener) {
        this.borrows = borrows;
        this.listener = listener;
    }

    @NonNull
    @Override
    public BorrowViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_borrow, parent, false);
        return new BorrowViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull BorrowViewHolder holder, int position) {
        Borrow borrow = borrows.get(position);
        holder.bind(borrow);
    }

    @Override
    public int getItemCount() {
        return borrows.size();
    }

    class BorrowViewHolder extends RecyclerView.ViewHolder {
        private TextView tvBookTitle;
        private TextView tvBookAuthor;
        private TextView tvBorrower;
        private TextView tvBorrowDate;
        private TextView tvDueDate;
        private TextView tvStatus;
        private TextView tvOverdue;
        private Button btnReturn;
        private ImageButton btnDelete;

        public BorrowViewHolder(@NonNull View itemView) {
            super(itemView);
            tvBookTitle = itemView.findViewById(R.id.tv_book_title);
            tvBookAuthor = itemView.findViewById(R.id.tv_book_author);
            tvBorrower = itemView.findViewById(R.id.tv_borrower);
            tvBorrowDate = itemView.findViewById(R.id.tv_borrow_date);
            tvDueDate = itemView.findViewById(R.id.tv_due_date);
            tvStatus = itemView.findViewById(R.id.tv_status);
            tvOverdue = itemView.findViewById(R.id.tv_overdue);
            btnReturn = itemView.findViewById(R.id.btn_return);
            btnDelete = itemView.findViewById(R.id.btn_delete);
        }

        public void bind(Borrow borrow) {
            // 显示图书信息
            tvBookTitle.setText(borrow.getBook().getTitle());
            tvBookAuthor.setText(borrow.getBook().getAuthor());
            
            // 显示借阅信息
            tvBorrower.setText(borrow.getBorrower());
            tvBorrowDate.setText(borrow.getBorrowDate());
            tvDueDate.setText(borrow.getDueDate());
            
            // 显示状态
            boolean isReturned = borrow.getReturnDate() != null;
            if (isReturned) {
                tvStatus.setText("已归还");
                tvStatus.setBackgroundResource(R.drawable.status_available);
                btnReturn.setVisibility(View.GONE);
                tvOverdue.setVisibility(View.GONE);
            } else {
                tvStatus.setText("借阅中");
                tvStatus.setBackgroundResource(R.drawable.status_borrowed);
                btnReturn.setVisibility(View.VISIBLE);
                
                // 检查是否逾期
                checkOverdue(borrow);
            }
            
            // 设置点击事件
            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onBorrowClick(borrow);
                }
            });
            
            btnReturn.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onReturnClick(borrow);
                }
            });
            
            btnDelete.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onDeleteClick(borrow);
                }
            });
        }
        
        private void checkOverdue(Borrow borrow) {
            try {
                Date dueDate = dateFormat.parse(borrow.getDueDate());
                Date currentDate = new Date();
                
                if (dueDate != null && currentDate.after(dueDate)) {
                    // 逾期
                    tvOverdue.setVisibility(View.VISIBLE);
                    tvOverdue.setText("逾期");
                    tvOverdue.setBackgroundResource(R.drawable.status_unavailable);
                } else {
                    tvOverdue.setVisibility(View.GONE);
                }
            } catch (ParseException e) {
                tvOverdue.setVisibility(View.GONE);
            }
        }
    }
}