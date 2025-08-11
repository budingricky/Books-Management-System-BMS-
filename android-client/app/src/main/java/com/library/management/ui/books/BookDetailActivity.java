package com.library.management.ui.books;

import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import com.google.android.material.card.MaterialCardView;
import com.library.management.R;
import com.library.management.api.ApiClient;
import com.library.management.api.ApiService;
import com.library.management.model.ApiResponse;
import com.library.management.model.Book;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BookDetailActivity extends AppCompatActivity {
    
    public static final String EXTRA_BOOK_ID = "book_id";
    public static final String EXTRA_BOOK = "book";
    
    private TextView tvTitle;
    private TextView tvAuthor;
    private TextView tvIsbn;
    private TextView tvCategory;
    private TextView tvLocation;
    private TextView tvStatus;
    private TextView tvBorrowInfo;
    private MaterialCardView cardBorrowInfo;
    private Button btnBorrow;
    private Button btnReturn;
    private ProgressBar progressBar;
    
    private Book currentBook;
    private ApiService apiService;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_book_detail);
        
        initViews();
        setupToolbar();
        setupClickListeners();
        
        apiService = ApiClient.getInstance().getApiService();
        
        loadBookData();
    }
    
    private void initViews() {
        tvTitle = findViewById(R.id.tv_title);
        tvAuthor = findViewById(R.id.tv_author);
        tvIsbn = findViewById(R.id.tv_isbn);
        tvCategory = findViewById(R.id.tv_category);
        tvLocation = findViewById(R.id.tv_location);
        tvStatus = findViewById(R.id.tv_status);
        tvBorrowInfo = findViewById(R.id.tv_borrow_info);
        cardBorrowInfo = findViewById(R.id.card_borrow_info);
        btnBorrow = findViewById(R.id.btn_borrow);
        btnReturn = findViewById(R.id.btn_return);
        progressBar = findViewById(R.id.progress_bar);
    }
    
    private void setupToolbar() {
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("图书详情");
        }
    }
    
    private void setupClickListeners() {
        btnBorrow.setOnClickListener(v -> showBorrowDialog());
        btnReturn.setOnClickListener(v -> showReturnDialog());
    }
    
    private void loadBookData() {
        Intent intent = getIntent();
        
        // 首先尝试从Intent中获取Book对象
        if (intent.hasExtra(EXTRA_BOOK)) {
            currentBook = (Book) intent.getSerializableExtra(EXTRA_BOOK);
            displayBookInfo(currentBook);
        } else if (intent.hasExtra(EXTRA_BOOK_ID)) {
            // 如果没有Book对象，则通过ID从API获取
            int bookId = intent.getIntExtra(EXTRA_BOOK_ID, -1);
            if (bookId != -1) {
                loadBookFromApi(bookId);
            } else {
                showError("无效的图书ID");
                finish();
            }
        } else {
            showError("缺少图书信息");
            finish();
        }
    }
    
    private void loadBookFromApi(int bookId) {
        showLoading(true);
        
        Call<ApiResponse<Book>> call = apiService.getBook(bookId);
        call.enqueue(new Callback<ApiResponse<Book>>() {
            @Override
            public void onResponse(Call<ApiResponse<Book>> call, Response<ApiResponse<Book>> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Book> apiResponse = response.body();
                    if (apiResponse.isSuccess() && apiResponse.getData() != null) {
                        currentBook = apiResponse.getData();
                        displayBookInfo(currentBook);
                    } else {
                        showError("获取图书信息失败: " + apiResponse.getMessage());
                    }
                } else {
                    showError("获取图书信息失败");
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Book>> call, Throwable t) {
                showLoading(false);
                showError("网络错误: " + t.getMessage());
            }
        });
    }
    
    private void displayBookInfo(Book book) {
        if (book == null) return;
        
        tvTitle.setText(book.getTitle());
        tvAuthor.setText(book.getAuthor());
        tvIsbn.setText(book.getIsbn());
        tvCategory.setText(book.getCategory());
        tvLocation.setText(book.getLocation());
        
        updateStatusDisplay(book);
        updateButtonsVisibility(book);
    }
    
    private void updateStatusDisplay(Book book) {
        String status = book.getStatus();
        if ("available".equals(status)) {
            tvStatus.setText("可借阅");
            tvStatus.setBackgroundResource(R.drawable.status_available);
            cardBorrowInfo.setVisibility(View.GONE);
        } else if ("borrowed".equals(status)) {
            tvStatus.setText("已借出");
            tvStatus.setBackgroundResource(R.drawable.status_borrowed);
            
            // 显示借阅信息
            if (book.getCurrentBorrow() != null) {
                String borrowInfo = String.format("借阅人: %s\n借阅日期: %s\n应还日期: %s",
                        book.getCurrentBorrow().getBorrower(),
                        book.getCurrentBorrow().getBorrowDate(),
                        book.getCurrentBorrow().getDueDate());
                tvBorrowInfo.setText(borrowInfo);
                cardBorrowInfo.setVisibility(View.VISIBLE);
            }
        } else {
            tvStatus.setText("不可用");
            tvStatus.setBackgroundResource(R.drawable.status_unavailable);
            cardBorrowInfo.setVisibility(View.GONE);
        }
    }
    
    private void updateButtonsVisibility(Book book) {
        String status = book.getStatus();
        if ("available".equals(status)) {
            btnBorrow.setVisibility(View.VISIBLE);
            btnReturn.setVisibility(View.GONE);
        } else if ("borrowed".equals(status)) {
            btnBorrow.setVisibility(View.GONE);
            btnReturn.setVisibility(View.VISIBLE);
        } else {
            btnBorrow.setVisibility(View.GONE);
            btnReturn.setVisibility(View.GONE);
        }
    }
    
    private void showBorrowDialog() {
        if (currentBook == null) return;
        
        BorrowDialogFragment dialog = BorrowDialogFragment.newInstance(currentBook);
        dialog.setOnBorrowListener(this::borrowBook);
        dialog.show(getSupportFragmentManager(), "BorrowDialog");
    }
    
    private void showReturnDialog() {
        new AlertDialog.Builder(this)
                .setTitle("归还图书")
                .setMessage("确定要归还这本图书吗？")
                .setPositiveButton("确定", (dialog, which) -> returnBook())
                .setNegativeButton("取消", null)
                .show();
    }
    
    private void borrowBook(int bookId, String borrower, String dueDate) {
        showLoading(true);
        
        ApiService.BorrowRequest request = new ApiService.BorrowRequest(bookId, borrower, dueDate);
        Call<ApiResponse<Void>> call = apiService.createBorrow(request);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Void> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        Toast.makeText(BookDetailActivity.this, "借阅成功", Toast.LENGTH_SHORT).show();
                        // 重新加载图书信息
                        loadBookFromApi(currentBook.getId());
                    } else {
                        showError("借阅失败: " + apiResponse.getMessage());
                    }
                } else {
                    showError("借阅失败");
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                showLoading(false);
                showError("网络错误: " + t.getMessage());
            }
        });
    }
    
    private void returnBook() {
        if (currentBook == null || currentBook.getCurrentBorrow() == null) return;
        
        showLoading(true);
        
        int borrowId = currentBook.getCurrentBorrow().getId();
        Call<ApiResponse<Void>> call = apiService.returnBorrow(borrowId);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Void> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        Toast.makeText(BookDetailActivity.this, "归还成功", Toast.LENGTH_SHORT).show();
                        // 重新加载图书信息
                        loadBookFromApi(currentBook.getId());
                    } else {
                        showError("归还失败: " + apiResponse.getMessage());
                    }
                } else {
                    showError("归还失败");
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                showLoading(false);
                showError("网络错误: " + t.getMessage());
            }
        });
    }
    
    private void showLoading(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        btnBorrow.setEnabled(!show);
        btnReturn.setEnabled(!show);
    }
    
    private void showError(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }
    
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.book_detail, menu);
        return true;
    }
    
    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        int id = item.getItemId();
        
        if (id == android.R.id.home) {
            finish();
            return true;
        } else if (id == R.id.action_edit) {
            editBook();
            return true;
        } else if (id == R.id.action_delete) {
            showDeleteDialog();
            return true;
        }
        
        return super.onOptionsItemSelected(item);
    }
    
    private void editBook() {
        // TODO: 实现编辑图书功能
        Toast.makeText(this, "编辑功能开发中", Toast.LENGTH_SHORT).show();
    }
    
    private void showDeleteDialog() {
        new AlertDialog.Builder(this)
                .setTitle("删除图书")
                .setMessage("确定要删除这本图书吗？此操作不可撤销。")
                .setPositiveButton("删除", (dialog, which) -> deleteBook())
                .setNegativeButton("取消", null)
                .show();
    }
    
    private void deleteBook() {
        if (currentBook == null) return;
        
        showLoading(true);
        
        Call<ApiResponse<Void>> call = apiService.deleteBook(currentBook.getId());
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Void> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        Toast.makeText(BookDetailActivity.this, "图书删除成功", Toast.LENGTH_SHORT).show();
                        setResult(RESULT_OK);
                        finish();
                    } else {
                        showError("删除失败: " + apiResponse.getMessage());
                    }
                } else {
                    showError("删除失败");
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                showLoading(false);
                showError("网络错误: " + t.getMessage());
            }
        });
    }
}