package com.library.management.ui.categories;

import android.app.AlertDialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.library.management.R;
import com.library.management.api.ApiClient;
import com.library.management.api.ApiService;
import com.library.management.model.ApiResponse;
import com.library.management.model.Category;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CategoriesFragment extends Fragment implements CategoryAdapter.OnCategoryClickListener {
    private RecyclerView recyclerView;
    private CategoryAdapter adapter;
    private SwipeRefreshLayout swipeRefreshLayout;
    private FloatingActionButton fabAdd;
    private ApiService apiService;
    private List<Category> categories;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_categories, container, false);
        
        initViews(view);
        setupRecyclerView();
        setupSwipeRefresh();
        setupFab();
        
        apiService = ApiClient.getApiService();
        categories = new ArrayList<>();
        
        loadCategories();
        
        return view;
    }

    private void initViews(View view) {
        recyclerView = view.findViewById(R.id.recycler_view);
        swipeRefreshLayout = view.findViewById(R.id.swipe_refresh);
        fabAdd = view.findViewById(R.id.fab_add);
    }

    private void setupRecyclerView() {
        adapter = new CategoryAdapter(categories, this);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        recyclerView.setAdapter(adapter);
    }

    private void setupSwipeRefresh() {
        swipeRefreshLayout.setOnRefreshListener(this::loadCategories);
    }

    private void setupFab() {
        fabAdd.setOnClickListener(v -> showAddCategoryDialog());
    }

    private void loadCategories() {
        swipeRefreshLayout.setRefreshing(true);
        
        apiService.getCategories().enqueue(new Callback<ApiResponse<List<Category>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Category>>> call, Response<ApiResponse<List<Category>>> response) {
                swipeRefreshLayout.setRefreshing(false);
                
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<List<Category>> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        categories.clear();
                        categories.addAll(apiResponse.getData());
                        adapter.notifyDataSetChanged();
                    } else {
                        showError(apiResponse.getMessage());
                    }
                } else {
                    showError("加载分类失败");
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<List<Category>>> call, Throwable t) {
                swipeRefreshLayout.setRefreshing(false);
                showError("网络连接失败: " + t.getMessage());
            }
        });
    }

    private void showAddCategoryDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(getContext());
        builder.setTitle("添加分类");
        
        View dialogView = LayoutInflater.from(getContext()).inflate(R.layout.dialog_add_category, null);
        EditText etName = dialogView.findViewById(R.id.et_category_name);
        EditText etDescription = dialogView.findViewById(R.id.et_category_description);
        
        builder.setView(dialogView);
        builder.setPositiveButton("添加", (dialog, which) -> {
            String name = etName.getText().toString().trim();
            String description = etDescription.getText().toString().trim();
            
            if (name.isEmpty()) {
                Toast.makeText(getContext(), "请输入分类名称", Toast.LENGTH_SHORT).show();
                return;
            }
            
            addCategory(name, description);
        });
        builder.setNegativeButton("取消", null);
        
        builder.show();
    }

    private void addCategory(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        
        apiService.createCategory(category).enqueue(new Callback<ApiResponse<Category>>() {
            @Override
            public void onResponse(Call<ApiResponse<Category>> call, Response<ApiResponse<Category>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Category> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        Toast.makeText(getContext(), "分类添加成功", Toast.LENGTH_SHORT).show();
                        loadCategories();
                    } else {
                        showError(apiResponse.getMessage());
                    }
                } else {
                    showError("添加分类失败");
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Category>> call, Throwable t) {
                showError("网络连接失败: " + t.getMessage());
            }
        });
    }

    @Override
    public void onCategoryClick(Category category) {
        showEditCategoryDialog(category);
    }

    @Override
    public void onDeleteClick(Category category) {
        new AlertDialog.Builder(getContext())
                .setTitle("删除分类")
                .setMessage("确定要删除分类 \"" + category.getName() + "\" 吗？")
                .setPositiveButton("删除", (dialog, which) -> deleteCategory(category))
                .setNegativeButton("取消", null)
                .show();
    }

    private void showEditCategoryDialog(Category category) {
        AlertDialog.Builder builder = new AlertDialog.Builder(getContext());
        builder.setTitle("编辑分类");
        
        View dialogView = LayoutInflater.from(getContext()).inflate(R.layout.dialog_add_category, null);
        EditText etName = dialogView.findViewById(R.id.et_category_name);
        EditText etDescription = dialogView.findViewById(R.id.et_category_description);
        
        etName.setText(category.getName());
        etDescription.setText(category.getDescription());
        
        builder.setView(dialogView);
        builder.setPositiveButton("保存", (dialog, which) -> {
            String name = etName.getText().toString().trim();
            String description = etDescription.getText().toString().trim();
            
            if (name.isEmpty()) {
                Toast.makeText(getContext(), "请输入分类名称", Toast.LENGTH_SHORT).show();
                return;
            }
            
            updateCategory(category.getId(), name, description);
        });
        builder.setNegativeButton("取消", null);
        
        builder.show();
    }

    private void updateCategory(Long categoryId, String name, String description) {
        Category category = new Category();
        category.setId(categoryId);
        category.setName(name);
        category.setDescription(description);
        
        apiService.updateCategory(categoryId, category).enqueue(new Callback<ApiResponse<Category>>() {
            @Override
            public void onResponse(Call<ApiResponse<Category>> call, Response<ApiResponse<Category>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Category> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        Toast.makeText(getContext(), "分类更新成功", Toast.LENGTH_SHORT).show();
                        loadCategories();
                    } else {
                        showError(apiResponse.getMessage());
                    }
                } else {
                    showError("更新分类失败");
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Category>> call, Throwable t) {
                showError("网络连接失败: " + t.getMessage());
            }
        });
    }

    private void deleteCategory(Category category) {
        apiService.deleteCategory(category.getId()).enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Void> apiResponse = response.body();
                    if (apiResponse.isSuccess()) {
                        Toast.makeText(getContext(), "分类删除成功", Toast.LENGTH_SHORT).show();
                        loadCategories();
                    } else {
                        showError(apiResponse.getMessage());
                    }
                } else {
                    showError("删除分类失败");
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                showError("网络连接失败: " + t.getMessage());
            }
        });
    }

    private void showError(String message) {
        Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
    }
}