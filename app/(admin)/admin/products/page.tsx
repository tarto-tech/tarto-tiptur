'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'

type ProductForm = { name: string; description: string; price: string; unit: string; image_url: string }
const EMPTY_FORM: ProductForm = { name: '', description: '', price: '', unit: '', image_url: '' }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchProducts() {
    const { data } = await (supabase.from('products') as any).select('*').order('created_at')
    if (data) setProducts(data as Product[])
  }

  useEffect(() => { fetchProducts() }, [])

  async function toggleStock(product: Product) {
    await (supabase.from('products') as any)
      .update({ in_stock: !product.in_stock })
      .eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, in_stock: !p.in_stock } : p))
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({ name: product.name, description: product.description ?? '', price: String(product.price), unit: product.unit, image_url: product.image_url ?? '' })
    setImageFile(null)
    setImagePreview(product.image_url ?? null)
    setShowForm(true)
  }

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    let image_url = form.image_url || null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage
        .from('product-images')
        .upload(path, imageFile, { upsert: true })
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(uploadData.path)
        image_url = urlData.publicUrl
      }
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      unit: form.unit,
      image_url,
    }
    if (editing) {
      await (supabase.from('products') as any).update(payload).eq('id', editing.id)
    } else {
      await (supabase.from('products') as any).insert({ ...payload, in_stock: true })
    }
    await fetchProducts()
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return
    setDeletingId(id)
    await (supabase.from('products') as any).delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
    setDeletingId(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Products</h1>
        <button
          onClick={openAdd}
          className="bg-[#2D6A4F] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#245a42] transition-colors"
        >
          + Add product
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <h2 className="font-semibold text-lg">{editing ? 'Edit product' : 'Add product'}</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium mb-1">Product image</label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#2D6A4F] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative h-32 w-full">
                    <Image src={imagePreview} alt="preview" fill className="object-contain rounded-lg" unoptimized={imagePreview.startsWith('blob:')} />
                  </div>
                ) : (
                  <div className="py-4 text-gray-400 text-sm">📷 Click to upload image</div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Price (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input
                  required
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="kg, litre, dozen…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#2D6A4F] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#245a42] disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <p className="text-gray-400 text-sm p-6 text-center">No products</p>
        ) : (
          <div className="divide-y">
            {products.map(product => (
              <div key={product.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-lg">🛒</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  {product.description && (
                    <p className="text-xs text-gray-400 truncate">{product.description}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-[#2D6A4F] w-20 text-right shrink-0">
                  ₹{Number(product.price).toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 w-16 shrink-0">{product.unit}</span>

                {/* In-stock toggle */}
                <button
                  onClick={() => toggleStock(product)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    product.in_stock ? 'bg-[#2D6A4F]' : 'bg-gray-200'
                  }`}
                  title={product.in_stock ? 'In stock — click to mark out of stock' : 'Out of stock — click to mark in stock'}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    product.in_stock ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-xs text-gray-400 w-20 shrink-0">
                  {product.in_stock ? 'In stock' : 'Out of stock'}
                </span>

                <button
                  onClick={() => openEdit(product)}
                  className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === product.id ? '…' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
