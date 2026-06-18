import { AppError, Favorite, type IFavorite } from "@hom-nay-an-gi/shared";

interface ListResult {
  items: IFavorite[];
  total: number;
  offset: number;
  limit: number;
}

export async function list(
  userId: string,
  offset: number,
  limit: number,
): Promise<ListResult> {
  const [items, total] = await Promise.all([
    Favorite.find({ userId })
      .sort({ savedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Favorite.countDocuments({ userId }),
  ]);
  return { items: items as unknown as IFavorite[], total, offset, limit };
}

export async function save(
  userId: string,
  dishId: string,
  dishData: Record<string, unknown>,
): Promise<IFavorite> {
  const existing = await Favorite.findOne({ userId, dishId });
  if (existing !== null) {
    throw new AppError(
      "FAVORITE_ALREADY_EXISTS",
      409,
      "Dish is already in your favorites",
    );
  }

  try {
    const favorite = await Favorite.create({
      userId,
      dishId,
      dishData,
    });
    return favorite.toObject() as IFavorite;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as Record<string, unknown>).code === 11000
    ) {
      throw new AppError(
        "FAVORITE_ALREADY_EXISTS",
        409,
        "Dish is already in your favorites",
      );
    }
    throw error;
  }
}

export async function remove(
  userId: string,
  favoriteId: string,
): Promise<void> {
  const favorite = await Favorite.findOneAndDelete({
    _id: favoriteId,
    userId,
  });
  if (favorite === null) {
    throw new AppError(
      "FAVORITE_NOT_FOUND",
      404,
      "Favorite not found or does not belong to you",
    );
  }
}
