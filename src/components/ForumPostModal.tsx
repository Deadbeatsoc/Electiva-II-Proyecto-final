import React, { useMemo, useState } from 'react';
import { MessageCircle, Send, ThumbsUp, X } from 'lucide-react';
import { Comment, ForumPost } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';

interface ForumPostModalProps {
  postId: string;
  onClose: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const ForumPostModal: React.FC<ForumPostModalProps> = ({ postId, onClose }) => {
  const { user } = useAuth();
  const {
    forumPosts,
    addPostComment,
    addReplyToComment,
    togglePostLike,
    toggleCommentLike,
    getCommentCount,
  } = useData();

  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const post = useMemo(() => forumPosts.find(item => item.id === postId), [forumPosts, postId]);

  if (!post) {
    return null;
  }

  const ensureAuth = () => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const handleSubmitComment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ensureAuth() || !commentContent.trim()) return;
    addPostComment(post.id, user!, commentContent.trim());
    setCommentContent('');
  };

  const handleReply = (commentId: string) => {
    if (!ensureAuth() || !replyContent.trim()) return;
    addReplyToComment(post.id, commentId, user!, replyContent.trim());
    setReplyingTo(null);
    setReplyContent('');
  };

  const handleLikePost = () => {
    if (!ensureAuth()) return;
    togglePostLike(post.id, user!.id);
  };

  const handleLikeComment = (commentId: string) => {
    if (!ensureAuth()) return;
    toggleCommentLike(post.id, commentId, user!.id);
  };

  const renderCommentThread = (comments: Comment[], depth = 0) => (
    <div className={`space-y-4 ${depth > 0 ? 'pl-6 border-l border-gray-200 ml-2' : ''}`}>
      {comments.map(comment => (
        <div key={comment.id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-900">{comment.user?.username || 'Usuario'}</p>
              <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
            </div>
            <button
              onClick={() => handleLikeComment(comment.id)}
              className={`flex items-center text-sm font-medium ${comment.liked_by?.includes(user?.id || '') ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
            >
              <ThumbsUp size={16} className="mr-1" />
              {comment.likes_count || 0}
            </button>
          </div>
          <p className="text-gray-700 whitespace-pre-line">{comment.content}</p>

          <div className="flex items-center space-x-4 mt-3 text-sm">
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Responder
            </button>
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escribe tu respuesta"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleReply(comment.id)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Send size={16} className="mr-1" />
                  Responder
                </button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && renderCommentThread(comment.replies, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{post.title}</h2>
              <div className="flex items-center text-sm text-gray-500 space-x-4 mt-1">
                <span>{post.user?.username || 'Usuario'}</span>
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar"
            >
              <X size={22} />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div>
              <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-b border-gray-200 py-3">
              <button
                onClick={handleLikePost}
                className={`inline-flex items-center space-x-2 text-sm font-medium ${post.liked_by.includes(user?.id || '') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
              >
                <ThumbsUp size={18} />
                <span>{post.liked_by.length} Me gusta</span>
              </button>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MessageCircle size={18} />
                <span>{getCommentCount(post.id)} comentarios</span>
              </div>
            </div>

            <form onSubmit={handleSubmitComment} className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Agregar comentario</label>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Comparte tu opinión o inicia una respuesta"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send size={18} className="mr-2" />
                  Comentar
                </button>
              </div>
            </form>

            {post.comments.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentarios</h3>
                {renderCommentThread(post.comments)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Sé el primero en comentar esta publicación.
              </div>
            )}
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
};

export default ForumPostModal;
