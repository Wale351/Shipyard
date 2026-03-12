import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { ImagePlus, Link as LinkIcon, Github, FileText, Layers, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';

export function SubmitApp() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [buildTime, setBuildTime] = useState('');
  
  // Tech stack state
  const [techStackInput, setTechStackInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);

  // File state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (data && !error) {
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      }
    }
    fetchCategories();
  }, []);

  const handleTechStackKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = techStackInput.trim();
      if (newTag && !techStack.includes(newTag)) {
        setTechStack([...techStack, newTag]);
      }
      setTechStackInput('');
    }
  };

  const removeTechTag = (tagToRemove: string) => {
    setTechStack(techStack.filter(tag => tag !== tagToRemove));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setScreenshotFiles(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setScreenshotPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshotFiles(prev => prev.filter((_, i) => i !== index));
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('app-assets')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('app-assets').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Check auth
      const { data: { user } } = await supabase.auth.getUser();
      
      // If no user, we can simulate a successful submission for preview purposes
      // or throw an error. Let's throw an error to encourage login.
      if (!user) {
        throw new Error('You must be logged in to launch an app.');
      }

      // 2. Upload Logo
      let logoUrl = '';
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'logos');
      }

      // 3. Upload Screenshots
      const screenshotUrls: string[] = [];
      for (const file of screenshotFiles) {
        const url = await uploadFile(file, 'screenshots');
        screenshotUrls.push(url);
      }

      // 4. Insert App
      const { data: newApp, error: insertError } = await supabase
        .from('apps')
        .insert({
          name,
          tagline,
          description,
          category_id: categoryId,
          website_url: websiteUrl,
          github_url: githubUrl || null,
          logo_url: logoUrl || null,
          screenshots: screenshotUrls,
          tech_stack: techStack,
          build_time: buildTime,
          builder_id: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 5. Redirect
      if (newApp) {
        navigate(`/app/${newApp.id}`);
      }
    } catch (err: any) {
      console.error('Launch error:', err);
      setError(err.message || 'Failed to launch app. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Launch your App</h1>
        <p className="text-zinc-500">Share what you've built with the Shipyard community.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>App Details</CardTitle>
          <CardDescription>Provide the core information about your application.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none">
                    App Name <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Shipyard" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium leading-none flex items-center gap-2">
                    <Layers className="w-4 h-4 text-zinc-500" />
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
                    required
                  >
                    {categories.length === 0 && <option value="">Loading categories...</option>}
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="tagline" className="text-sm font-medium leading-none">
                  Tagline <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="tagline" 
                  placeholder="A short, catchy description (max 60 chars)" 
                  maxLength={60} 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium leading-none flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  Full Description <span className="text-red-500">*</span>
                </label>
                <textarea 
                  id="description" 
                  className="flex min-h-[120px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
                  placeholder="Tell us more about what your app does, how you built it, and why it's awesome."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-medium leading-none flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-zinc-500" />
                  Website URL <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="url" 
                  type="url" 
                  placeholder="https://..." 
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="github" className="text-sm font-medium leading-none flex items-center gap-2">
                  <Github className="w-4 h-4 text-zinc-500" />
                  GitHub URL (Optional)
                </label>
                <Input 
                  id="github" 
                  type="url" 
                  placeholder="https://github.com/..." 
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Tech Stack & Build Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div className="space-y-2">
                <label htmlFor="techStack" className="text-sm font-medium leading-none">
                  Tech Stack
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {techStack.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md text-sm">
                      {tag}
                      <button type="button" onClick={() => removeTechTag(tag)} className="text-zinc-500 hover:text-zinc-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <Input 
                  id="techStack" 
                  placeholder="Type a technology and press Enter (e.g. React, Supabase)" 
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  onKeyDown={handleTechStackKeyDown}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="buildTime" className="text-sm font-medium leading-none flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  Build Time
                </label>
                <Input 
                  id="buildTime" 
                  placeholder="e.g. 48 hours, 2 weeks" 
                  value={buildTime}
                  onChange={(e) => setBuildTime(e.target.value)}
                />
              </div>
            </div>

            {/* Media Uploads */}
            <div className="space-y-6 pt-4 border-t border-zinc-100">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-zinc-500" />
                  App Logo <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative w-16 h-16 rounded-xl border border-zinc-200 overflow-hidden">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="absolute top-0 right-0 bg-black/50 text-white p-1 rounded-bl-lg hover:bg-black/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-zinc-200 border-dashed flex items-center justify-center bg-zinc-50">
                      <ImagePlus className="w-6 h-6 text-zinc-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoChange}
                      required={!logoFile}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Recommended size: 256x256px. Max 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-zinc-500" />
                  Screenshots
                </label>
                <Input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleScreenshotsChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-zinc-500">Upload up to 5 screenshots showing off your app.</p>
                
                {screenshotPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                    {screenshotPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-video rounded-lg border border-zinc-200 overflow-hidden">
                        <img src={preview} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeScreenshot(index)}
                          className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-md hover:bg-black/70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Launching App...' : 'Launch App'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
