import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Observable, from, map, switchMap } from 'rxjs';
import { User } from '../models/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.enity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private jwtService: JwtService
  ) {}

  hashPassword(password: string): Observable<string> {
    return from(bcrypt.hash(password, 12));
  }

  registerAccount(user: User): Observable<User> {
    const { firstName, lastName, email, password } = user;

    return this.hashPassword(password).pipe(
      switchMap((hashedPassword: string) => {
        return from(
          this.userRepository.save({
            firstName,
            lastName,
            email,
            password: hashedPassword,
          }),
        ).pipe(
          map((user: User) => {
            delete user.password;
            return user;
          }),
        );
      }),
    );
  }

  validateUser(email: string, password: string): Observable<User> {
    return from(
      this.userRepository.findOne({
        select: ['id', 'firstName', 'lastName', 'email', 'password', 'role'],
        where : {email}
      }),
    ).pipe(
        switchMap((user:User)=>{
            return from(bcrypt.compare(password,user.password)).pipe(
                map((isValidPassword: boolean)=>{
                    if(isValidPassword){
                        delete user.password;
                        return user;
                    }
                })
            )
        })
    );
  }

  login(user: User): Observable<string> {
    const {email, password} = user;
    return this.validateUser(email ,password).pipe(
        switchMap((user:User)=>{
            if(user){
                // create JWT credentials
                return from(this.jwtService.signAsync({user}))
            }
        })
    );
  }

  findUserById(id : number): Observable<User>{
    return from(
      this.userRepository.findOne({id},{relations: ['feedPosts']})
    ).pipe(
      map((user: User) => {
        delete user.password;
        return user;
      })
    )
  }
}
