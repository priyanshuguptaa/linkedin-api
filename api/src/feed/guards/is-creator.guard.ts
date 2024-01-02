import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable, map, switchMap } from 'rxjs';
import { AuthService } from 'src/auth/services/auth.service';
import { FeedService } from '../services/feed.service';
import { User } from 'src/auth/models/user.interface';
import { FeedPost } from '../models/post.interface';

@Injectable()
export class IsCreatorGuard implements CanActivate {

  constructor(private authService: AuthService, private feedService: FeedService){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest();
    const {user, params} : {user : User, params : {id : number}} = request;

    if(!user || !params){
      return false;
    }

    if(user.role === 'admin'){
      return true; // allows admin to make changes
    }

    const userId = user.id;
    const feedId = params.id;

    // Deteremine if login user is same as the one who created posts
    return this.authService.findUserById(userId).pipe(
      switchMap((user: User)=> this.feedService.findPostById(feedId).pipe(
        map((feedPost: FeedPost)=>{
          let isAuthor = user.id === feedPost.author.id;
          return isAuthor;
        })
      ))
    )
  }
}
