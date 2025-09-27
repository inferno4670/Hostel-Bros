'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Post, Comment, User } from '@/types';
import { 
  Plus, 
  Heart, 
  MessageCircle, 
  Share2, 
  Image as ImageIcon, 
  FileText, 
  Link as LinkIcon,
  X,
  Upload,
  Send,
  Trash2,
  Flag
} from 'lucide-react';
import { formatDate, getRelativeTime, generateId } from '@/lib/utils';

export default function SocialWallPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [newPost, setNewPost] = useState({
    type: 'text' as 'text' | 'image' | 'doc' | 'link' | 'meme',
    content: '',
    fileUrl: '',
    fileName: ''
  });

  // Comment state
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});

  useEffect(() => {
    if (!user) return;

    // Fetch all users
    const fetchUsers = async () => {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    };

    // Listen to posts
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Post[];
      
      // Only show approved posts or posts by admins
      const filteredPosts = postsData.filter(post => 
        post.isApproved || user?.role === 'admin'
      );
      
      setPosts(filteredPosts);
      setLoading(false);
    });

    fetchUsers();
    return () => unsubscribe();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const fileType = file.type.startsWith('image/') ? 'image' : 'doc';
      setNewPost({
        ...newPost,
        type: fileType,
        fileName: file.name
      });
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${generateId()}.${fileExtension}`;
    const storageRef = ref(storage, `posts/${fileName}`);
    
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!newPost.content && !selectedFile)) return;

    setUploading(true);
    
    try {
      let fileUrl = '';
      let fileName = '';
      
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        fileName = selectedFile.name;
      }

      await addDoc(collection(db, 'posts'), {
        type: newPost.type,
        content: newPost.content,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        postedBy: user.id,
        likes: [],
        comments: [],
        tags: extractTags(newPost.content),
        createdAt: new Date(),
        isApproved: user.role === 'admin' // Auto-approve admin posts
      });

      // Reset form
      setNewPost({
        type: 'text',
        content: '',
        fileUrl: '',
        fileName: ''
      });
      setSelectedFile(null);
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setUploading(false);
    }
  };

  const extractTags = (content: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const tags = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1].toLowerCase());
    }
    return tags;
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const isLiked = post.likes.includes(user.id);
      
      if (isLiked) {
        await updateDoc(doc(db, 'posts', postId), {
          likes: arrayRemove(user.id)
        });
      } else {
        await updateDoc(doc(db, 'posts', postId), {
          likes: arrayUnion(user.id)
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return;

    try {
      const newComment: Comment = {
        id: generateId(),
        content: commentInputs[postId].trim(),
        postedBy: user.id,
        createdAt: new Date()
      };

      await updateDoc(doc(db, 'posts', postId), {
        comments: arrayUnion(newComment)
      });

      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleApprovePost = async (postId: string) => {
    if (user?.role !== 'admin') return;

    try {
      await updateDoc(doc(db, 'posts', postId), {
        isApproved: true
      });
    } catch (error) {
      console.error('Error approving post:', error);
    }
  };

  const getPostTypeIcon = (type: string) => {
    const icons = {
      text: MessageCircle,
      image: ImageIcon,
      doc: FileText,
      link: LinkIcon,
      meme: ImageIcon
    };
    return icons[type as keyof typeof icons] || MessageCircle;
  };

  const getPostTypeColor = (type: string) => {
    const colors = {
      text: 'bg-blue-100 text-blue-600',
      image: 'bg-green-100 text-green-600',
      doc: 'bg-purple-100 text-purple-600',
      link: 'bg-orange-100 text-orange-600',
      meme: 'bg-pink-100 text-pink-600'
    };
    return colors[type as keyof typeof colors] || colors.text;
  };

  const postTypes = [
    { value: 'text', label: 'Text Post', icon: MessageCircle },
    { value: 'image', label: 'Image/Meme', icon: ImageIcon },
    { value: 'doc', label: 'Document', icon: FileText },
    { value: 'link', label: 'Link', icon: LinkIcon }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Social Wall</h1>
            <p className="text-gray-600">Share memes, announcements, and connect with hostel mates</p>
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Post</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{posts.length}</h3>
                <p className="text-gray-600">Total Posts</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-red-100 rounded-lg p-3">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {posts.reduce((total, post) => total + post.likes.length, 0)}
                </h3>
                <p className="text-gray-600">Total Likes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <ImageIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {posts.filter(p => p.type === 'image').length}
                </h3>
                <p className="text-gray-600">Images/Memes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {posts.reduce((total, post) => total + post.comments.length, 0)}
                </h3>
                <p className="text-gray-600">Comments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-4">Be the first to share something on the social wall!</p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Post
              </button>
            </div>
          ) : (
            posts.map((post) => {
              const author = users.find(u => u.id === post.postedBy);
              const isLiked = post.likes.includes(user?.id || '');
              const canDelete = post.postedBy === user?.id || user?.role === 'admin';
              const PostTypeIcon = getPostTypeIcon(post.type);
              
              return (
                <div key={post.id} className="bg-white rounded-lg shadow">
                  {/* Post Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-500 rounded-full p-2">
                          <span className="text-white font-semibold text-sm">
                            {author?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{author?.name || 'Unknown User'}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{getRelativeTime(post.createdAt)}</span>
                            <span>•</span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.type)}`}>
                              <PostTypeIcon className="h-3 w-3 inline mr-1" />
                              {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!post.isApproved && user?.role === 'admin' && (
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        
                        {!post.isApproved && (
                          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                            Pending Approval
                          </div>
                        )}
                        
                        {canDelete && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Post Content */}
                  <div className="px-6 py-4">
                    {post.content && (
                      <p className="text-gray-900 mb-4 whitespace-pre-wrap">{post.content}</p>
                    )}
                    
                    {post.fileUrl && post.type === 'image' && (
                      <div className="mb-4">
                        <img 
                          src={post.fileUrl} 
                          alt={post.fileName || 'Post image'}
                          className="max-w-full h-auto rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                    
                    {post.fileUrl && post.type === 'doc' && (
                      <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">{post.fileName}</p>
                            <a 
                              href={post.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Download File
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag) => (
                          <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Post Actions */}
                  <div className="px-6 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-2 transition-colors ${
                            isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                          }`}
                        >
                          <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes.length}</span>
                        </button>
                        
                        <button
                          onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })}
                          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span>{post.comments.length}</span>
                        </button>
                        
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                          <Share2 className="h-5 w-5" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comments Section */}
                  {showComments[post.id] && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      {/* Add Comment */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-blue-500 rounded-full p-1">
                          <span className="text-white font-semibold text-xs">
                            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            placeholder="Write a comment..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim()}
                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Comments List */}
                      <div className="space-y-3">
                        {post.comments.map((comment) => {
                          const commentAuthor = users.find(u => u.id === comment.postedBy);
                          
                          return (
                            <div key={comment.id} className="flex items-start space-x-3">
                              <div className="bg-gray-500 rounded-full p-1">
                                <span className="text-white font-semibold text-xs">
                                  {commentAuthor?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                </span>
                              </div>
                              <div className="flex-1 bg-white rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900 text-sm">
                                    {commentAuthor?.name || 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {getRelativeTime(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-gray-900 text-sm">{comment.content}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Post</h3>
                  <button
                    onClick={() => setShowCreatePost(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleCreatePost} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {postTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setNewPost({ ...newPost, type: type.value as 'text' | 'image' | 'doc' | 'link' | 'meme' })}
                          className={`p-3 border rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                            newPost.type === type.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="What's on your mind? Use #hashtags to categorize your post!"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* File uploads disabled - enable when Firebase Storage is set up
                {(newPost.type === 'image' || newPost.type === 'doc') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newPost.type === 'image' ? 'Upload Image/Meme' : 'Upload Document'}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center text-gray-500">
                        File uploads require Firebase Storage setup
                      </div>
                    </div>
                  </div>
                )}
                */}
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Community Guidelines:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Keep content respectful and appropriate</li>
                    <li>• No harassment, hate speech, or personal attacks</li>
                    <li>• Memes and fun content are encouraged!</li>
                    <li>• Posts may require admin approval</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreatePost(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || (!newPost.content && !selectedFile)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Posting...</span>
                      </>
                    ) : (
                      <span>Create Post</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}