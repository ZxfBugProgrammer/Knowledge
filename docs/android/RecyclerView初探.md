# RecyclerView初探
<br>

# RecyclerVIew的缓存机制

`RecyclerView`的类图如下

![image-20240204141859691](assets/RecyclerView%E5%88%9D%E6%8E%A2/image-20240204141859691.png)

可以看到与缓存相关的类是`Recycler`。从获取VIew的方法是`recycler.getViewForPosition(mCurrentPosition)`。

```Kotlin
ViewHolder tryGetViewHolderForPositionByDeadline(int position,
        boolean dryRun, long deadlineNs) {
    if (position < 0 || position >= mState.getItemCount()) {
        throw new IndexOutOfBoundsException("Invalid item position " + position
                + "(" + position + "). Item count:" + mState.getItemCount()
                + exceptionLabel());
    }
    boolean fromScrapOrHiddenOrCache = false;
    ViewHolder holder = null;
    // 0) If there is a changed scrap, try to find from there
    if (mState.isPreLayout()) {
        holder = getChangedScrapViewForPosition(position);
        fromScrapOrHiddenOrCache = holder != null;
    }
    // 1) Find by position from scrap/hidden list/cache
    if (holder == null) {
        holder = getScrapOrHiddenOrCachedHolderForPosition(position, dryRun);
        if (holder != null) {
            if (!validateViewHolderForOffsetPosition(holder)) {
                // recycle holder (and unscrap if relevant) since it can't be used
                if (!dryRun) {
                    // we would like to recycle this but need to make sure it is not used by
                    // animation logic etc.
                    holder.addFlags(ViewHolder.FLAG_INVALID);
                    if (holder.isScrap()) {
                        removeDetachedView(holder.itemView, false);
                        holder.unScrap();
                    } else if (holder.wasReturnedFromScrap()) {
                        holder.clearReturnedFromScrapFlag();
                    }
                    recycleViewHolderInternal(holder);
                }
                holder = null;
            } else {
                fromScrapOrHiddenOrCache = true;
            }
        }
    }
    if (holder == null) {
        final int offsetPosition = mAdapterHelper.findPositionOffset(position);
        if (offsetPosition < 0 || offsetPosition >= mAdapter.getItemCount()) {
            throw new IndexOutOfBoundsException("Inconsistency detected. Invalid item "
                    + "position " + position + "(offset:" + offsetPosition + ")."
                    + "state:" + mState.getItemCount() + exceptionLabel());
        }

        final int type = mAdapter.getItemViewType(offsetPosition);
        // 2) Find from scrap/cache via stable ids, if exists
        if (mAdapter.hasStableIds()) {
            holder = getScrapOrCachedViewForId(mAdapter.getItemId(offsetPosition),
                    type, dryRun);
            if (holder != null) {
                // update position
                holder.mPosition = offsetPosition;
                fromScrapOrHiddenOrCache = true;
            }
        }
        if (holder == null && mViewCacheExtension != null) {
            // We are NOT sending the offsetPosition because LayoutManager does not
            // know it.
            final View view = mViewCacheExtension
                    .getViewForPositionAndType(this, position, type);
            if (view != null) {
                holder = getChildViewHolder(view);
                if (holder == null) {
                    throw new IllegalArgumentException("getViewForPositionAndType returned"
                            + " a view which does not have a ViewHolder"
                            + exceptionLabel());
                } else if (holder.shouldIgnore()) {
                    throw new IllegalArgumentException("getViewForPositionAndType returned"
                            + " a view that is ignored. You must call stopIgnoring before"
                            + " returning this view." + exceptionLabel());
                }
            }
        }
        if (holder == null) { // fallback to pool
            if (DEBUG) {
                Log.d(TAG, "tryGetViewHolderForPositionByDeadline("
                        + position + ") fetching from shared pool");
            }
            holder = getRecycledViewPool().getRecycledView(type);
            if (holder != null) {
                holder.resetInternal();
                if (FORCE_INVALIDATE_DISPLAY_LIST) {
                    invalidateDisplayListInt(holder);
                }
            }
        }
        if (holder == null) {
            long start = getNanoTime();
            if (deadlineNs != FOREVER_NS
                    && !mRecyclerPool.willCreateInTime(type, start, deadlineNs)) {
                // abort - we have a deadline we can't meet
                return null;
            }
            holder = mAdapter.createViewHolder(RecyclerView.this, type);
            if (ALLOW_THREAD_GAP_WORK) {
                // only bother finding nested RV if prefetching
                RecyclerView innerView = findNestedRecyclerView(holder.itemView);
                if (innerView != null) {
                    holder.mNestedRecyclerView = new WeakReference<>(innerView);
                }
            }

            long end = getNanoTime();
            mRecyclerPool.factorInCreateTime(type, end - start);
            if (DEBUG) {
                Log.d(TAG, "tryGetViewHolderForPositionByDeadline created new ViewHolder");
            }
        }
    }

    // This is very ugly but the only place we can grab this information
    // before the View is rebound and returned to the LayoutManager for post layout ops.
    // We don't need this in pre-layout since the VH is not updated by the LM.
    if (fromScrapOrHiddenOrCache && !mState.isPreLayout() && holder
            .hasAnyOfTheFlags(ViewHolder.FLAG_BOUNCED_FROM_HIDDEN_LIST)) {
        holder.setFlags(0, ViewHolder.FLAG_BOUNCED_FROM_HIDDEN_LIST);
        if (mState.mRunSimpleAnimations) {
            int changeFlags = ItemAnimator
                    .buildAdapterChangeFlagsForAnimations(holder);
            changeFlags |= ItemAnimator.FLAG_APPEARED_IN_PRE_LAYOUT;
            final ItemHolderInfo info = mItemAnimator.recordPreLayoutInformation(mState,
                    holder, changeFlags, holder.getUnmodifiedPayloads());
            recordAnimationInfoIfBouncedHiddenView(holder, info);
        }
    }

    boolean bound = false;
    if (mState.isPreLayout() && holder.isBound()) {
        // do not update unless we absolutely have to.
        holder.mPreLayoutPosition = position;
    } else if (!holder.isBound() || holder.needsUpdate() || holder.isInvalid()) {
        if (DEBUG && holder.isRemoved()) {
            throw new IllegalStateException("Removed holder should be bound and it should"
                    + " come here only in pre-layout. Holder: " + holder
                    + exceptionLabel());
        }
        final int offsetPosition = mAdapterHelper.findPositionOffset(position);
        bound = tryBindViewHolderByDeadline(holder, offsetPosition, position, deadlineNs);
    }

    final ViewGroup.LayoutParams lp = holder.itemView.getLayoutParams();
    final LayoutParams rvLayoutParams;
    if (lp == null) {
        rvLayoutParams = (LayoutParams) generateDefaultLayoutParams();
        holder.itemView.setLayoutParams(rvLayoutParams);
    } else if (!checkLayoutParams(lp)) {
        rvLayoutParams = (LayoutParams) generateLayoutParams(lp);
        holder.itemView.setLayoutParams(rvLayoutParams);
    } else {
        rvLayoutParams = (LayoutParams) lp;
    }
    rvLayoutParams.mViewHolder = holder;
    rvLayoutParams.mPendingInvalidate = fromScrapOrHiddenOrCache && bound;
    return holder;
}
```

分析上述源码可得获取`View`的流程如下：

1. 根据 position 获取 changedScrap(被更新的ViewHolder)
2. 根据 position 获取 AttachedScrap(还在屏幕中的ViewHolder)，CachedViews(缓存离开屏幕的viewHolder)
3. 根据 ItemId 获取 AttachedScrap，CachedViews
4. 根据 position, type 从 自定义缓存 获取 ViewHolder
5. 根据 type 从 RecycledViewPool 获取对应的 ViewHolder
6. 如果仍没有成功获取View，则创建 ViewHolder
7. 判断是否需要 bindViewHolder

```Kotlin
public final class Recycler {
    private ArrayList<ViewHolder> mChangedScrap = null; 
    final ArrayList<ViewHolder> mAttachedScrap = new ArrayList<>();      
    final ArrayList<ViewHolder> mCachedViews = new ArrayList<ViewHolder>(); 
    private ViewCacheExtension mViewCacheExtension;
    private RecycledViewPool mRecyclerPool;
} 
```

上述几种缓存变量对比如下：

| **缓存变量对比**   |                      |                    |                                                              |
| :----------------- | -------------------- | ------------------ | ------------------------------------------------------------ |
| **变量**           | **CreateViewHolder** | **bindViewHolder** | **含义**                                                     |
| mAttachedScrap     | 否                   | 否                 | 存储当前还在屏幕中的ViewHolder。按照position和id进行匹配。   |
| mChangedScrap      | 否                   | 是                 | 存储是数据被更新的ViewHolder，比如调用了Adapter的 notifyChange系列方法。 |
| mCachedViews       | 否                   | 否                 | 默认大小为2+layout.extraCache，缓存离开屏幕的viewHolder。    |
| ViewCacheExtension | 否                   | 否                 | 自定义缓存，实现getViewForPositionAndType方法。              |
| RecyclerViewPool   | 否                   | 是                 | 根据ViewType来缓存ViewHolder，每个ViewType的缓存池的大小默认为5。 |

> ![image-20240204141908091](assets/RecyclerView%E5%88%9D%E6%8E%A2/image-20240204141908091.png)
>
> mCachedViews的大小需要加上mLayout.mPrefetchMaxCountObserved

源码中是如何判断是否需要`bindViewHolder`呢？

答案是通过`if (!holder.isBound() || holder.needsUpdate() || holder.isInvalid())`进行判断。

`ViewHolder`的`isInvalid`、`isRemoved`、`isBound`、`isTmpDetached`、`isScrap` 和 `isUpdated` 这几个方法的对比如下：

| **ViewHolder状态方法对比** |                                                       |                                                              |
| :------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| **方法名**                 | **FLAG**                                              | **含义**                                                     |
| isInvalid                  | FLAG_INVALID                                          | 表示当前ViewHolder是否已经失效。调用了Adapter的notifyDataSetChanged方法； 手动调用RecyclerView的invalidateItemDecorations方法； 调用RecyclerView的setAdapter方法或者swapAdapter方法。 |
| isRemoved                  | FLAG_REMOVED                                          | 表示当前的ViewHolder是否被移除。通常来说，数据源被移除了部分数据，然后调用Adapter的notifyItemRemoved方法。 |
| isBound                    | FLAG_BOUND                                            | 表示当前ViewHolder是否已经调用了onBindViewHolder。           |
| isTmpDetached              | FLAG_TMP_DETACHED                                     | 表示当前的ItemView是否从RecyclerView(即父View)detach。       |
| isScrap                    | 无Flag来表示该状态，用mScrapContainer是否为null来判断 | 表示是否在mAttachedScrap或者mChangedScrap数组里面，进而表示当前ViewHolder是否被废弃。 |
| needsUpdate                | FLAG_UPDATE                                           | 表示当前ViewHolder需要更新。isInvalid方法存在的三种情况；调用了Adapter的onBindViewHolder方法；调用了Adapter的notifyItemChanged方法 |

![image-20240204141913247](assets/RecyclerView%E5%88%9D%E6%8E%A2/image-20240204141913247.png)

# ViewHolder的生命周期

以下视频剪辑自https://www.youtube.com/watch?v=LqBlYJTfLP4 (消音、剪辑、变速)

结合该视频片段，我们可以很好的体会ViewHolder整个的生命周期。

<video controls="controls" src="./assets/RecyclerView%E5%88%9D%E6%8E%A2/RecyclerView_ins_and_outs_Google_IO _2016.mp4" />

# 示例

```Kotlin
2023-06-25 14:21:08.122 31226-31226 AppsRecyclerViewAdapter      D  onCreateViewHolder 0
2023-06-25 14:21:08.145 31226-31226 AppsRecyclerViewAdapter      D  onBindViewHolder 10
2023-06-25 14:21:08.155 31226-31226 AppsRecyclerViewAdapter      D  onViewAttachedToWindow 10
2023-06-25 14:21:09.732 31226-31226 AppsRecyclerViewAdapter      D  onViewDetachedFromWindow 0
2023-06-25 14:21:10.134 31226-31226 AppsRecyclerViewAdapter      D  onCreateViewHolder 0
2023-06-25 14:21:10.153 31226-31226 AppsRecyclerViewAdapter      D  onBindViewHolder 11
2023-06-25 14:21:10.163 31226-31226 AppsRecyclerViewAdapter      D  onViewAttachedToWindow 11
2023-06-25 14:21:12.855 31226-31226 AppsRecyclerViewAdapter      D  onViewDetachedFromWindow 1
2023-06-25 14:21:12.967 31226-31226 AppsRecyclerViewAdapter      D  onCreateViewHolder 0
2023-06-25 14:21:12.986 31226-31226 AppsRecyclerViewAdapter      D  onBindViewHolder 12
2023-06-25 14:21:12.997 31226-31226 AppsRecyclerViewAdapter      D  onViewAttachedToWindow 12
2023-06-25 14:21:14.422 31226-31226 AppsRecyclerViewAdapter      D  onViewDetachedFromWindow 2
2023-06-25 14:21:14.444 31226-31226 AppsRecyclerViewAdapter      D  onCreateViewHolder 0
2023-06-25 14:21:14.462 31226-31226 AppsRecyclerViewAdapter      D  onBindViewHolder 13
2023-06-25 14:21:14.464 31226-31226 AppsRecyclerViewAdapter      D  onViewRecycled 0
2023-06-25 14:21:14.485 31226-31226 AppsRecyclerViewAdapter      D  onViewAttachedToWindow 13
2023-06-25 14:21:14.495 31226-31226 AppsRecyclerViewAdapter      D  onBindViewHolder 14
2023-06-25 14:21:16.123 31226-31226 AppsRecyclerViewAdapter      D  onViewDetachedFromWindow 3
2023-06-25 14:21:16.127 31226-31226 AppsRecyclerViewAdapter      D  onViewRecycled 1
2023-06-25 14:21:16.202 31226-31226 AppsRecyclerViewAdapter      D  onViewAttachedToWindow 14
2023-06-25 14:21:16.213 31226-31226 AppsRecyclerViewAdapter      D  onBindViewHolder 15
2023-06-25 14:21:17.578 31226-31226 AppsRecyclerViewAdapter      D  onViewDetachedFromWindow 4
2023-06-25 14:21:17.582 31226-31226 AppsRecyclerViewAdapter      D  onViewRecycled 2
2023-06-25 14:21:17.620 31226-31226 AppsRecyclerViewAdapter      D  onViewAttachedToWindow 15
```

<video controls="controls" src="./assets/RecyclerView%E5%88%9D%E6%8E%A2/RecyclerView.mp4" />