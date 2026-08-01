<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClientController extends Controller
{
    use ApiResponse;

    /**
     * عرض جميع العملاء
     */
    public function index(Request $request)
    {
        $query = Client::query();

        // بحث
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        // ترتيب
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // تقسيم الصفحات
        $perPage = $request->per_page ?? 15;
        $clients = $query->paginate($perPage);

        return $this->success($clients);
    }

    /**
     * عرض عميل محدد
     */
    public function show($id)
    {
        $client = Client::with(['offers', 'requests'])->find($id);
        if (!$client) {
            return $this->notFound('العميل غير موجود');
        }

        return $this->success($client);
    }

    /**
     * إنشاء عميل جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $client = Client::create($request->all());

        return $this->success($client, 'تم إنشاء العميل بنجاح', 201);
    }

    /**
     * تحديث عميل
     */
    public function update(Request $request, $id)
    {
        $client = Client::find($id);
        if (!$client) {
            return $this->notFound('العميل غير موجود');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'email' => 'nullable|email|max:255'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $client->update($request->all());

        return $this->success($client, 'تم تحديث العميل بنجاح');
    }

    /**
     * حذف عميل
     */
    public function destroy($id)
    {
        $client = Client::find($id);
        if (!$client) {
            return $this->notFound('العميل غير موجود');
        }

        $client->delete();

        return $this->success(null, 'تم حذف العميل بنجاح');
    }

    /**
     * عروض العميل
     */
    public function offers($id)
    {
        $client = Client::find($id);
        if (!$client) {
            return $this->notFound('العميل غير موجود');
        }

        $offers = $client->offers()->with(['propertyType', 'dealType', 'currentStage'])->get();

        return $this->success($offers);
    }

    /**
     * طلبات العميل
     */
    public function requests($id)
    {
        $client = Client::find($id);
        if (!$client) {
            return $this->notFound('العميل غير موجود');
        }

        $requests = $client->requests()->with(['propertyType', 'dealType', 'currentStage'])->get();

        return $this->success($requests);
    }
}