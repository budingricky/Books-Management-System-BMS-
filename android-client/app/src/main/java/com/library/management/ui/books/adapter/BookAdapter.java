package com.library.management.ui.books.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.library.management.R;
import com.library.management.model.Book;
import java.util.List;

public class BookAdapter extends RecyclerView.Adapter<BookAdapter.BookViewHolder> {
    
    private List<Book> bookList;
    private OnBookClickListener listener;
    
    public interface OnBookClickListener {
        void onBookClick(Book book);
        void onBorrowClick(Book book);
    }
    
    public BookAdapter(List<Book> bookList, OnBookClickListener listener) {
        this.bookList = bookList;
        this.listener = listener;
    }
    
    @NonNull
    @Override
    public BookViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_book, parent, false);
        return new BookViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull BookViewHolder holder, int position) {
        Book book = bookList.get(position);
        holder.bind(book);
    }
    
    @Override
    public int getItemCount() {
        return bookList.size();
    }
    
    class BookViewHolder extends RecyclerView.ViewHolder {
        private TextView tvTitle;
        private TextView tvAuthor;
        private TextView tvIsbn;
        private TextView tvCategory;
        private TextView tvStatus;
        private TextView tvLocation;
        private Button btnBorrow;
        
        public BookViewHolder(@NonNull View itemView) {
            super(itemView);
            
            tvTitle = itemView.findViewById(R.id.tv_book_title);
            tvAuthor = itemView.findViewById(R.id.tv_book_author);
            tvIsbn = itemView.findViewById(R.id.tv_book_isbn);
            tvCategory = itemView.findViewById(R.id.tv_book_category);
            tvStatus = itemView.findViewById(R.id.tv_book_status);
            tvLocation = itemView.findViewById(R.id.tv_book_location);
            btnBorrow = itemView.findViewById(R.id.btn_borrow);
            
            itemView.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onBookClick(bookList.get(position));
                }
            });
            
            btnBorrow.setOnClickListener(v -> {
                int position = getAdapterPosition();
                if (position != RecyclerView.NO_POSITION && listener != null) {
                    listener.onBorrowClick(bookList.get(position));
                }
            });
        }
        
        public void bind(Book book) {
            tvTitle.setText(book.getTitle());
            tvAuthor.setText("作者: " + (book.getAuthor() != null ? book.getAuthor() : "未知"));
            tvIsbn.setText("ISBN: " + (book.getIsbn() != null ? book.getIsbn() : "无"));
            tvCategory.setText("分类: " + (book.getCategory() != null ? book.getCategory() : "未分类"));
            tvLocation.setText("位置: " + book.getLocation());
            
            // 设置状态显示
            if (book.isAvailable()) {
                tvStatus.setText("可借阅");
                tvStatus.setTextColor(itemView.getContext().getResources().getColor(android.R.color.holo_green_dark));
                btnBorrow.setEnabled(true);
                btnBorrow.setText("借阅");
            } else {
                tvStatus.setText("已借出");
                tvStatus.setTextColor(itemView.getContext().getResources().getColor(android.R.color.holo_red_dark));
                btnBorrow.setEnabled(false);
                btnBorrow.setText("已借出");
            }
        }
    }
}