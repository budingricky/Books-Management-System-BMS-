package com.library.management.ui.books;

import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.library.management.R;
import com.library.management.api.ApiClient;
import com.library.management.api.ApiService;
import com.library.management.model.ApiResponse;
import com.library.management.model.Book;
import com.library.management.model.Category;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.ArrayList;
import java.util.List;

public class AddBookActivity extends AppCompatActivity {
    
    private TextInputEditText etTitle;
    private TextInputEditText etAuthor;
    private TextInputEditText etIsbn;
    private AutoCompleteTextView etCategory;
    private TextInputEditText etLocation;
    private TextInputLayout tilCategory;
    
    private Button btnScanIsbn;
    private Button btnLookupIsbn;
    private Button btnSave;
    private Button btnCancel;
    private ProgressBar progressBar;
    
    private ApiService apiService;
    private List<Category> categories = new ArrayList<>();
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_book);
        
        initViews();
        setupToolbar();
        setupClickListeners();
        loadCategories();
        
        apiService = ApiClient.getInstance().getApiService();
    }
    
    private void initViews() {
        etTitle = findViewById(R.id.et_title);
        etAuthor = findViewById(R.id.et_author);
        etIsbn = findViewById(R.id.et_isbn);
        etCategory = findViewById(R.id.et_category);
        etLocation = findViewById(R.id.et_location);
        tilCategory = findViewById(R.id.til_category);
        
        btnScanIsbn = findViewById(R.id.btn_scan_isbn);
        btnLookupIsbn = findViewById(R.id.btn_lookup_isbn);
        btnSave = findViewById(R.id.btn_save);
        btnCancel = findViewById(R.id.btn_cancel);
        progressBar = findViewById(R.id.progress_bar);
    }
    
    private void setupToolbar() {
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("添加图书");
        }
    }
    
    private void setupClickListeners() {
        btnScanIsbn.setOnClickListener(v -> scanIsbn());
        btnLookupIsbn.setOnClickListener(v -> lookupIsbn());
        btnSave.setOnClickListener(v -> saveBook());
        btnCancel.setOnClickListener(v -> finish());
    }
    
    private void loadCategories() {
        Call<ApiResponse<List<Category>>> call = apiService.getCategories();
        call.enqueue(new Callback<ApiResponse<List<Category>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Category>>> call, Response<ApiResponse<List<Category>>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<List<Category>> apiResponse = response.body();
                    if (apiResponse.isSuccess() && apiResponse.getData() != null) {
                        categories = apiResponse.getData();
                        setupCategoryDropdown();
                    }
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<List<Category>>> call, Throwable t) {
                // 使用默认分类
                setupDefaultCategories();
            }
        });
    }
    
    private void setupCategoryDropdown() {
        List<String> categoryNames = new ArrayList<>();
        for (Category category : categories) {
            categoryNames.add(category.getName());
        }
        
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, 
                android.R.layout.simple_dropdown_item_1line, categoryNames);
        etCategory.setAdapter(adapter);
    }
    
    private void setupDefaultCategories() {
        List<String> defaultCategories = new ArrayList<>();
        defaultCategories.add("文学");
        defaultCategories.add("科学");
        defaultCategories.add("历史");
        defaultCategories.add("艺术");
        defaultCategories.add("技术");
        defaultCategories.add("其他");
        
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, 
                android.R.layout.simple_dropdown_item_1line, defaultCategories);
        etCategory.setAdapter(adapter);
    }
    
    private void scanIsbn() {
        // TODO: 实现ISBN扫描功能
        Toast.makeText(this, "ISBN扫描功能开发中", Toast.LENGTH_SHORT).show();
    }
    
    private void lookupIsbn() {
        String isbn = etIsbn.getText().toString().trim();
        if (isbn.isEmpty()) {
            etIsbn.setError("请输入ISBN");
            return;
        }
        
        showLoading(true);
        
        Call<ApiResponse<Book>> call = apiService.getBookByIsbn(isbn);
        call.enqueue(new Callback<ApiResponse<Book>>() {
            @Override
            public void onResponse(Call<ApiResponse<Book>> call, Response<ApiResponse<Book>> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Book> apiResponse = response.body();
                    if (apiResponse.isSuccess() && apiResponse.getData() != null) {
                        fillBookInfo(apiResponse.getData());
                    } else {
                        Toast.makeText(AddBookActivity.this, "未找到该ISBN对应的图书信息", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(AddBookActivity.this, "查询失败", Toast.LENGTH_SHORT).show();
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Book>> call, Throwable t) {
                showLoading(false);
                Toast.makeText(AddBookActivity.this, "网络错误: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
    
    private void fillBookInfo(Book book) {
        if (book.getTitle() != null) {
            etTitle.setText(book.getTitle());
        }
        if (book.getAuthor() != null) {
            etAuthor.setText(book.getAuthor());
        }
        if (book.getCategory() != null) {
            etCategory.setText(book.getCategory());
        }
    }
    
    private void saveBook() {
        if (!validateInput()) {
            return;
        }
        
        Book book = createBookFromInput();
        showLoading(true);
        
        Call<ApiResponse<Book>> call = apiService.createBook(book);
        call.enqueue(new Callback<ApiResponse<Book>>() {
            @Override
            public void onResponse(Call<ApiResponse<Book>> call, Response<ApiResponse<Book>> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Book> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        Toast.makeText(AddBookActivity.this, "图书添加成功", Toast.LENGTH_SHORT).show();
                        setResult(RESULT_OK);
                        finish();
                    } else {
                        Toast.makeText(AddBookActivity.this, "添加失败: " + apiResponse.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(AddBookActivity.this, "添加失败", Toast.LENGTH_SHORT).show();
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Book>> call, Throwable t) {
                showLoading(false);
                Toast.makeText(AddBookActivity.this, "网络错误: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
    
    private boolean validateInput() {
        boolean isValid = true;
        
        String title = etTitle.getText().toString().trim();
        if (title.isEmpty()) {
            etTitle.setError("请输入图书标题");
            isValid = false;
        }
        
        String author = etAuthor.getText().toString().trim();
        if (author.isEmpty()) {
            etAuthor.setError("请输入作者");
            isValid = false;
        }
        
        String isbn = etIsbn.getText().toString().trim();
        if (isbn.isEmpty()) {
            etIsbn.setError("请输入ISBN");
            isValid = false;
        }
        
        String category = etCategory.getText().toString().trim();
        if (category.isEmpty()) {
            tilCategory.setError("请选择分类");
            isValid = false;
        } else {
            tilCategory.setError(null);
        }
        
        String location = etLocation.getText().toString().trim();
        if (location.isEmpty()) {
            etLocation.setError("请输入存放位置");
            isValid = false;
        }
        
        return isValid;
    }
    
    private Book createBookFromInput() {
        Book book = new Book();
        book.setTitle(etTitle.getText().toString().trim());
        book.setAuthor(etAuthor.getText().toString().trim());
        book.setIsbn(etIsbn.getText().toString().trim());
        book.setCategory(etCategory.getText().toString().trim());
        book.setLocation(etLocation.getText().toString().trim());
        book.setStatus("available");
        return book;
    }
    
    private void showLoading(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        btnSave.setEnabled(!show);
        btnLookupIsbn.setEnabled(!show);
        btnScanIsbn.setEnabled(!show);
    }
    
    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}